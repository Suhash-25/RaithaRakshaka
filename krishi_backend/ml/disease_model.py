import io
import json
import os
from functools import lru_cache
from typing import Any, Dict, List, Optional

from PIL import Image


DEFAULT_MODEL_PATH = os.getenv(
    "CROP_DISEASE_MODEL_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "crop_disease_mobilenet_v3_small.pt"),
)


DISEASE_CATALOG: Dict[str, Dict[str, Any]] = {
    "Anthracnose": {
        "scientific_name": "Colletotrichum spp.",
        "symptoms": ["Sunken dark lesions", "Leaf spots with yellow halos", "Fruit or stem rot in humid weather"],
        "chemical": ["Use a labeled copper or mancozeb fungicide if disease is spreading"],
        "biological": ["Apply Trichoderma or Bacillus-based biocontrol as a preventive support"],
        "cultural": ["Remove infected plant parts", "Improve spacing and airflow", "Avoid overhead irrigation"],
    },
    "Apple Scab": {
        "crop": "Apple",
        "scientific_name": "Venturia inaequalis",
        "symptoms": ["Olive brown leaf spots", "Scabby fruit lesions", "Premature leaf drop"],
        "chemical": ["Use a locally recommended protectant fungicide during wet infection periods"],
        "biological": ["Use compost tea or biocontrol only as a preventive supplement"],
        "cultural": ["Collect fallen leaves", "Prune for airflow", "Avoid dense canopy humidity"],
    },
    "Black Spot": {
        "scientific_name": "Diplocarpon or related leaf spot fungi",
        "symptoms": ["Circular black spots", "Yellowing around lesions", "Leaf drop"],
        "chemical": ["Use labeled fungicide when new spots continue appearing"],
        "biological": ["Use neem or Bacillus-based products as preventive cover"],
        "cultural": ["Remove infected leaves", "Water at soil level", "Keep foliage dry"],
    },
    "Blight": {
        "scientific_name": "Alternaria, Phytophthora, or bacterial blight complex",
        "symptoms": ["Rapid browning", "Leaf lesions expanding from edges", "Wilting or burnt patches"],
        "chemical": ["Use crop-labeled fungicide or bactericide after local confirmation"],
        "biological": ["Use Trichoderma or Pseudomonas formulations where suitable"],
        "cultural": ["Destroy infected debris", "Avoid overhead irrigation", "Rotate away from host crops"],
    },
    "Blossom End Rot": {
        "scientific_name": "Calcium uptake disorder",
        "symptoms": ["Dark sunken fruit bottom", "Dry leathery patch", "Uneven irrigation history"],
        "chemical": ["Avoid unnecessary fungicide; this is usually physiological, not infectious"],
        "biological": ["Add organic matter to improve moisture buffering"],
        "cultural": ["Keep irrigation even", "Mulch the crop", "Correct calcium and pH after soil testing"],
    },
    "Botrytis": {
        "scientific_name": "Botrytis cinerea",
        "symptoms": ["Gray fuzzy mold", "Flower blight", "Soft rot in humid conditions"],
        "chemical": ["Use a labeled botrytis fungicide if canopy infection is active"],
        "biological": ["Use Bacillus or Trichoderma products preventively"],
        "cultural": ["Increase airflow", "Remove dead flowers and debris", "Reduce canopy humidity"],
    },
    "Brown Rot": {
        "scientific_name": "Monilinia spp.",
        "symptoms": ["Brown fruit rot", "Concentric spore rings", "Blossom blight"],
        "chemical": ["Use labeled fungicide during flowering and pre-harvest risk windows"],
        "biological": ["Use biocontrol as a supplement, not a rescue spray"],
        "cultural": ["Remove mummified fruits", "Prune infected twigs", "Improve orchard sanitation"],
    },
    "Canker": {
        "scientific_name": "Fungal or bacterial canker complex",
        "symptoms": ["Sunken stem lesions", "Gumming or cracked bark", "Branch dieback"],
        "chemical": ["Use copper-based protectant only where locally recommended"],
        "biological": ["Use wound-protecting biocontrol products after pruning if available"],
        "cultural": ["Prune below infected tissue", "Disinfect pruning tools", "Avoid plant stress"],
    },
    "Cedar Apple Rust": {
        "crop": "Apple",
        "scientific_name": "Gymnosporangium juniperi-virginianae",
        "symptoms": ["Orange leaf spots", "Rust-colored spores", "Nearby juniper hosts"],
        "chemical": ["Use a rust-labeled fungicide at early leaf infection stage"],
        "biological": ["Biological control has limited curative value for rust"],
        "cultural": ["Remove nearby alternate host galls where practical", "Use resistant varieties"],
    },
    "Clubroot": {
        "scientific_name": "Plasmodiophora brassicae",
        "symptoms": ["Swollen distorted roots", "Wilting in heat", "Stunted brassica plants"],
        "chemical": ["Avoid curative sprays; soil pH and rotation are more important"],
        "biological": ["Use beneficial soil microbes only with resistant varieties and sanitation"],
        "cultural": ["Raise soil pH with lime after soil test", "Rotate away from brassicas", "Improve drainage"],
    },
    "Crown Gall": {
        "scientific_name": "Agrobacterium tumefaciens",
        "symptoms": ["Hard galls near crown", "Root or stem swellings", "Weak growth"],
        "chemical": ["There is no reliable curative spray after gall formation"],
        "biological": ["Use preventive Agrobacterium radiobacter products where available"],
        "cultural": ["Remove severely affected plants", "Avoid root wounds", "Plant disease-free nursery stock"],
    },
    "Downy Mildew": {
        "scientific_name": "Oomycete downy mildew pathogens",
        "symptoms": ["Yellow angular leaf patches", "Downy growth under leaves", "Fast spread in cool humid weather"],
        "chemical": ["Use a labeled oomycete fungicide if weather favors spread"],
        "biological": ["Use preventive biocontrol, especially before humid periods"],
        "cultural": ["Improve airflow", "Avoid evening irrigation", "Remove infected leaves"],
    },
    "Fire Blight": {
        "crop": "Apple/Pear",
        "scientific_name": "Erwinia amylovora",
        "symptoms": ["Shepherd's crook shoots", "Blackened blossoms", "Oozing cankers"],
        "chemical": ["Use copper or antibiotic programs only under local official guidance"],
        "biological": ["Use blossom biocontrol products preventively where registered"],
        "cultural": ["Prune infected shoots well below symptoms", "Disinfect tools", "Avoid excess nitrogen"],
    },
    "Fusarium": {
        "scientific_name": "Fusarium spp.",
        "symptoms": ["Vascular browning", "Yellowing and wilt", "Root or crown rot"],
        "chemical": ["Soil-borne fusarium has limited curative spray options"],
        "biological": ["Use Trichoderma-enriched compost or seed treatment where recommended"],
        "cultural": ["Rotate crops", "Improve drainage", "Use resistant varieties"],
    },
    "Gray Mold": {
        "scientific_name": "Botrytis cinerea",
        "symptoms": ["Gray mold growth", "Soft infected tissues", "High humidity outbreaks"],
        "chemical": ["Use a labeled gray mold fungicide if infection is active"],
        "biological": ["Use Bacillus-based products preventively"],
        "cultural": ["Remove dead tissues", "Increase airflow", "Reduce leaf wetness"],
    },
    "Leaf Spots": {
        "scientific_name": "Fungal or bacterial leaf spot complex",
        "symptoms": ["Small brown or black spots", "Yellow halos", "Lower leaf infection first"],
        "chemical": ["Use copper or mancozeb-type protectants only if locally recommended for the crop"],
        "biological": ["Use neem, Bacillus, or Pseudomonas products as preventive support"],
        "cultural": ["Remove infected leaves", "Avoid overhead irrigation", "Rotate crops"],
    },
    "Mosaic Virus": {
        "scientific_name": "Plant mosaic virus complex",
        "symptoms": ["Mottled yellow-green leaves", "Leaf distortion", "Stunted growth"],
        "chemical": ["Do not spray fungicide; viruses are not cured by fungicides"],
        "biological": ["Use sticky traps and natural enemy support for vector management"],
        "cultural": ["Remove infected plants", "Control aphids/whiteflies", "Use virus-free seed or seedlings"],
    },
    "Nematodes": {
        "scientific_name": "Plant-parasitic nematodes",
        "symptoms": ["Root knots or lesions", "Patchy stunting", "Wilting despite moisture"],
        "chemical": ["Use nematicide only with expert guidance and label compliance"],
        "biological": ["Use neem cake, Paecilomyces, or other registered bionematicides"],
        "cultural": ["Solarize soil", "Rotate with non-host crops", "Add organic matter"],
    },
    "Powdery Mildew": {
        "scientific_name": "Erysiphales fungi",
        "symptoms": ["White powdery leaf growth", "Leaf curling", "Spread in dry days with humid nights"],
        "chemical": ["Use sulfur or labeled mildew fungicide where crop-safe"],
        "biological": ["Use potassium bicarbonate or Bacillus products preventively"],
        "cultural": ["Improve airflow", "Avoid excess nitrogen", "Remove infected leaves"],
    },
    "Verticillium": {
        "scientific_name": "Verticillium spp.",
        "symptoms": ["One-sided wilt", "Vascular discoloration", "Stunting in patches"],
        "chemical": ["No reliable curative foliar spray exists for verticillium wilt"],
        "biological": ["Use soil health amendments and beneficial microbes as preventive support"],
        "cultural": ["Rotate with non-host crops", "Use resistant varieties", "Remove infected residues"],
    },
}


def _severity_from_confidence(confidence: float) -> str:
    if confidence >= 80:
        return "High"
    if confidence >= 55:
        return "Medium"
    return "Low"


def _crop_from_label(label: str, requested_crop: str) -> str:
    crop = DISEASE_CATALOG.get(label, {}).get("crop")
    return crop or requested_crop or "Crop"


def payload_from_prediction(label: str, confidence: float, requested_crop: str = "") -> Dict[str, Any]:
    info = DISEASE_CATALOG.get(label, {})
    crop = _crop_from_label(label, requested_crop)
    symptoms = info.get("symptoms") or ["Visible leaf or plant stress"]
    return {
        "disease": label,
        "crop": crop,
        "scientific_name": info.get("scientific_name", "Field inspection recommended"),
        "confidence": round(confidence, 1),
        "severity": _severity_from_confidence(confidence),
        "symptoms": symptoms,
        "diagnosis": (
            f"The trained crop disease model classified this image as {label}. "
            f"Typical signs include {', '.join(symptoms[:3])}. Confirm with field symptoms before treatment."
        ),
        "treatment": {
            "cultural": info.get("cultural") or ["Remove infected material", "Improve spacing and airflow"],
            "biological": info.get("biological") or ["Use locally registered biocontrol products preventively"],
            "chemical": info.get("chemical") or ["Use only crop-labeled products after local confirmation"],
        },
        "prevention": info.get("cultural") or ["Use resistant varieties", "Keep field sanitation"],
        "organic_remedy": (info.get("biological") or ["Use registered biological products preventively"])[0],
        "urgency": "Act soon and inspect nearby plants" if confidence >= 55 else "Low-confidence result; retake a clear leaf image",
        "model_note": "" if confidence >= 55 else "Model confidence is low. Upload a close, well-lit image of the affected leaf.",
    }


class CropDiseaseModel:
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self._loaded = False
        self._error: Optional[str] = None
        self._labels: List[str] = []
        self._model = None
        self._transform = None
        self._device = "cpu"

    @property
    def available(self) -> bool:
        self._ensure_loaded()
        return bool(self._model and self._labels)

    @property
    def error(self) -> Optional[str]:
        self._ensure_loaded()
        return self._error

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        if not os.path.exists(self.model_path):
            self._error = f"Model file not found: {self.model_path}"
            return
        try:
            import torch
            from torchvision import models, transforms

            checkpoint = torch.load(self.model_path, map_location=self._device)
            labels = checkpoint.get("labels") or checkpoint.get("class_names") or []
            if not labels:
                raise ValueError("Checkpoint is missing labels")

            weights = models.MobileNet_V3_Small_Weights.DEFAULT
            model = models.mobilenet_v3_small(weights=weights)
            model.classifier[-1] = torch.nn.Linear(model.classifier[-1].in_features, len(labels))
            model.load_state_dict(checkpoint["model_state"])
            model.eval()

            image_size = int(checkpoint.get("image_size") or 224)
            self._transform = transforms.Compose(
                [
                    transforms.Resize((image_size, image_size)),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=weights.transforms().mean, std=weights.transforms().std),
                ]
            )
            self._labels = list(labels)
            self._model = model
        except Exception as exc:
            self._error = f"Could not load crop disease model: {exc}"
            self._model = None

    def predict(self, image_bytes: bytes, crop: str = "", top_k: int = 3) -> Optional[Dict[str, Any]]:
        self._ensure_loaded()
        if not self._model or not self._transform:
            return None
        try:
            import torch

            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor = self._transform(image).unsqueeze(0)
            with torch.no_grad():
                logits = self._model(tensor)
                probs = torch.softmax(logits, dim=1)[0]
                values, indexes = torch.topk(probs, k=min(top_k, len(self._labels)))
            top = [
                {"label": self._labels[int(idx)], "confidence": round(float(value) * 100, 1)}
                for value, idx in zip(values, indexes)
            ]
            best = top[0]
            payload = payload_from_prediction(best["label"], best["confidence"], crop)
            payload["top_predictions"] = top
            payload["source"] = "crop-disease-ml"
            payload["model_path"] = self.model_path
            return payload
        except Exception as exc:
            self._error = f"Prediction failed: {exc}"
            return None


@lru_cache(maxsize=1)
def get_crop_disease_model() -> CropDiseaseModel:
    return CropDiseaseModel()


def model_status() -> Dict[str, Any]:
    model = get_crop_disease_model()
    return {
        "configured_path": model.model_path,
        "available": model.available,
        "error": model.error,
    }


def write_label_catalog(path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(DISEASE_CATALOG, handle, indent=2, ensure_ascii=True)
