import argparse
import json
import os
import random
from typing import Dict, List

import torch
from datasets import load_dataset
from PIL import Image
from torch.utils.data import DataLoader
from torchvision import models, transforms

from ml.disease_model import DEFAULT_MODEL_PATH, write_label_catalog


DATASET_NAME = "vishnun0027/Crop_Disease"


class HFDiseaseDataset(torch.utils.data.Dataset):
    def __init__(self, hf_dataset, transform):
        self.dataset = hf_dataset
        self.transform = transform

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, idx):
        item = self.dataset[idx]
        image = item["image"]
        if not isinstance(image, Image.Image):
            image = Image.open(image)
        image = image.convert("RGB")
        return self.transform(image), int(item["label"])


def make_loaders(image_size: int, batch_size: int, val_size: float, seed: int, max_samples: int):
    ds = load_dataset(DATASET_NAME, split="train")
    if max_samples and max_samples < len(ds):
        ds = ds.shuffle(seed=seed).select(range(max_samples))
    split = ds.train_test_split(test_size=val_size, seed=seed, stratify_by_column="label")

    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    train_tfms = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(12),
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.12),
            transforms.ToTensor(),
            transforms.Normalize(mean=weights.transforms().mean, std=weights.transforms().std),
        ]
    )
    val_tfms = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=weights.transforms().mean, std=weights.transforms().std),
        ]
    )
    labels = ds.features["label"].names
    train_loader = DataLoader(
        HFDiseaseDataset(split["train"], train_tfms),
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
    )
    val_loader = DataLoader(
        HFDiseaseDataset(split["test"], val_tfms),
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
    )
    return train_loader, val_loader, labels


def build_model(num_classes: int, freeze_backbone: bool):
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)
    if freeze_backbone:
        for param in model.features.parameters():
            param.requires_grad = False
    
    # Get the input features from the last layer (which should be a Linear layer)
    last_layer = model.classifier[-1]
    if isinstance(last_layer, torch.nn.Linear):
        in_features = last_layer.in_features
    else:
        # Fallback in case the architecture changes
        in_features = 1024  # Default for MobileNetV3 Small
    
    model.classifier[-1] = torch.nn.Linear(in_features, num_classes)
    return model


def evaluate(model, loader, device):
    model.eval()
    correct = 0
    total = 0
    loss_total = 0.0
    criterion = torch.nn.CrossEntropyLoss()
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)
            logits = model(images)
            loss = criterion(logits, labels)
            loss_total += float(loss.item()) * labels.size(0)
            correct += int((logits.argmax(dim=1) == labels).sum().item())
            total += labels.size(0)
    return {
        "loss": round(loss_total / max(total, 1), 4),
        "accuracy": round(correct / max(total, 1), 4),
    }


def train(args):
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    device = "cuda" if torch.cuda.is_available() and not args.cpu else "cpu"
    train_loader, val_loader, labels = make_loaders(
        image_size=args.image_size,
        batch_size=args.batch_size,
        val_size=args.val_size,
        seed=args.seed,
        max_samples=args.max_samples,
    )

    model = build_model(len(labels), args.freeze_backbone).to(device)
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=args.lr,
        weight_decay=args.weight_decay,
    )
    criterion = torch.nn.CrossEntropyLoss()

    best_accuracy = -1.0
    best_metrics: Dict[str, float] = {}
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    write_label_catalog(os.path.join(os.path.dirname(args.output), "crop_disease_treatment_catalog.json"))

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        seen = 0
        for step, (images, targets) in enumerate(train_loader, start=1):
            images = images.to(device)
            targets = targets.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()
            running_loss += float(loss.item()) * targets.size(0)
            seen += targets.size(0)
            if step % args.log_every == 0:
                print(f"epoch={epoch} step={step} train_loss={running_loss / max(seen, 1):.4f}")

        metrics = evaluate(model, val_loader, device)
        metrics["train_loss"] = round(running_loss / max(seen, 1), 4)
        print(f"epoch={epoch} metrics={json.dumps(metrics)}")
        if metrics["accuracy"] > best_accuracy:
            best_accuracy = metrics["accuracy"]
            best_metrics = metrics
            torch.save(
                {
                    "model_state": model.state_dict(),
                    "labels": labels,
                    "image_size": args.image_size,
                    "dataset": DATASET_NAME,
                    "arch": "mobilenet_v3_small",
                    "metrics": metrics,
                },
                args.output,
            )
            print(f"saved_best={args.output}")

    print(f"best_metrics={json.dumps(best_metrics)}")


def parse_args():
    parser = argparse.ArgumentParser(description="Train crop disease classifier from Hugging Face dataset.")
    parser.add_argument("--output", default=DEFAULT_MODEL_PATH)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--val-size", type=float, default=0.18)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--max-samples", type=int, default=0, help="Use a smaller subset for a quick smoke train.")
    parser.add_argument("--freeze-backbone", action="store_true", help="Train only the classifier head.")
    parser.add_argument("--cpu", action="store_true")
    parser.add_argument("--log-every", type=int, default=20)
    return parser.parse_args()


if __name__ == "__main__":
    train(parse_args())
