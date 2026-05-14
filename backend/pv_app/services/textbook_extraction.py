"""Structured extraction for textbook PDFs.

The extracted layer is intentionally lightweight:
one JSON file per PDF containing source metadata, PDF metadata,
and a normalized table of contents.
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from pypdf import PdfReader

ProgressCallback = Callable[[dict[str, Any]], None]


def extract_dataset(
    dataset_root: Path,
    output_root: Path,
    *,
    overwrite: bool = True,
    include_hash: bool = False,
    progress_callback: ProgressCallback | None = None,
    limit: int | None = None,
) -> dict[str, Any]:
    """Extract every PDF beneath the dataset root into one JSON per file."""

    dataset_root = dataset_root.resolve()
    output_root = output_root.resolve()
    pdf_paths = sorted(dataset_root.rglob("*.pdf"))
    if limit is not None and limit >= 0:
        pdf_paths = pdf_paths[:limit]

    documents: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []

    for index, pdf_path in enumerate(pdf_paths, start=1):
        relative_pdf_path = pdf_path.relative_to(dataset_root)
        descriptor = _build_document_descriptor(pdf_path, dataset_root)
        output_path = _output_path_for_descriptor(descriptor, output_root)

        if progress_callback is not None:
            progress_callback(
                {
                    "event": "processing",
                    "index": index,
                    "total": len(pdf_paths),
                    "relative_pdf_path": str(relative_pdf_path).replace("\\", "/"),
                    "output_json_path": str(output_path.relative_to(output_root)).replace("\\", "/"),
                }
            )

        try:
            if output_path.exists() and not overwrite:
                documents.append(
                    {
                        "document_id": descriptor["document_id"],
                        "class_slug": descriptor["class_slug"],
                        "subject_slug": descriptor["subject_slug"],
                        "relative_pdf_path": str(relative_pdf_path).replace("\\", "/"),
                        "output_json_path": str(output_path.relative_to(output_root)).replace("\\", "/"),
                        "status": "skipped_existing",
                    }
                )
            else:
                document = extract_pdf_document(pdf_path, dataset_root, include_hash=include_hash)
                output_path = write_extracted_document(document, output_root, overwrite=overwrite)
                documents.append(
                    {
                        "document_id": document["document_id"],
                        "class_slug": document["curriculum"]["class_slug"],
                        "subject_slug": document["curriculum"]["subject_slug"],
                        "relative_pdf_path": document["source"]["relative_pdf_path"],
                        "output_json_path": str(output_path.relative_to(output_root)).replace("\\", "/"),
                        "status": "generated",
                    }
                )
        except Exception as exc:
            failures.append(
                {
                    "pdf_path": str(relative_pdf_path).replace("\\", "/"),
                    "error": str(exc),
                }
            )

    manifest = {
        "schema_version": 1,
        "generated_at": _utc_now(),
        "dataset_root": str(dataset_root),
        "output_root": str(output_root),
        "pdf_count": len(pdf_paths),
        "document_count": len(documents),
        "failure_count": len(failures),
        "documents": documents,
        "failures": failures,
    }

    output_root.mkdir(parents=True, exist_ok=True)
    manifest_path = output_root / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def extract_pdf_document(
    pdf_path: Path,
    dataset_root: Path,
    *,
    include_hash: bool = False,
) -> dict[str, Any]:
    """Build the extracted JSON payload for a single PDF."""

    pdf_path = pdf_path.resolve()
    dataset_root = dataset_root.resolve()
    relative_pdf_path = pdf_path.relative_to(dataset_root)
    descriptor = _build_document_descriptor(pdf_path, dataset_root)
    file_stats = pdf_path.stat()

    with pdf_path.open("rb") as pdf_file:
        reader = PdfReader(pdf_file)
        toc = _extract_toc(reader)
        document_title = _document_title(reader, pdf_path)
        page_count = len(reader.pages)
        metadata = _normalize_metadata(reader.metadata)

    return {
        "schema_version": 1,
        "document_id": descriptor["document_id"],
        "extracted_at": _utc_now(),
        "source": {
            "file_name": pdf_path.name,
            "relative_pdf_path": str(relative_pdf_path).replace("\\", "/"),
            "absolute_pdf_path": str(pdf_path),
            "file_size_bytes": file_stats.st_size,
            "modified_at": datetime.fromtimestamp(file_stats.st_mtime, tz=timezone.utc).isoformat(),
            "sha256": _sha256(pdf_path) if include_hash else None,
        },
        "curriculum": {
            "class_label": descriptor["class_label"],
            "class_slug": descriptor["class_slug"],
            "subject_label": descriptor["subject_label"],
            "subject_slug": descriptor["subject_slug"],
            "document_title": document_title,
        },
        "pdf": {
            "page_count": page_count,
            "metadata": metadata,
            "has_toc": bool(toc),
        },
        "toc": toc,
    }


def write_extracted_document(
    document: dict[str, Any],
    output_root: Path,
    *,
    overwrite: bool = True,
) -> Path:
    """Write one extracted JSON file to disk."""

    output_path = _output_path_for_document(document, output_root)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists() and not overwrite:
        return output_path

    output_path.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
    return output_path


def _build_document_descriptor(pdf_path: Path, dataset_root: Path) -> dict[str, str]:
    relative_pdf_path = pdf_path.resolve().relative_to(dataset_root.resolve())
    class_label = relative_pdf_path.parts[0] if relative_pdf_path.parts else "Unknown Class"
    subject_label = _infer_subject_label(pdf_path.stem)
    class_slug = _slugify(class_label)
    subject_slug = _slugify(subject_label)
    document_slug = _slugify(pdf_path.stem)

    return {
        "class_label": class_label,
        "class_slug": class_slug,
        "subject_label": subject_label,
        "subject_slug": subject_slug,
        "document_slug": document_slug,
        "document_id": f"{class_slug}--{document_slug}",
    }


def _output_path_for_document(document: dict[str, Any], output_root: Path) -> Path:
    return _output_path_for_descriptor(
        {
            "class_slug": document["curriculum"]["class_slug"],
            "subject_slug": document["curriculum"]["subject_slug"],
            "document_id": document["document_id"],
        },
        output_root,
    )


def _output_path_for_descriptor(descriptor: dict[str, str], output_root: Path) -> Path:
    return output_root / descriptor["class_slug"] / descriptor["subject_slug"] / f"{descriptor['document_id']}.json"


def _document_title(reader: PdfReader, pdf_path: Path) -> str:
    metadata = _normalize_metadata(reader.metadata)
    title = metadata.get("title")
    if isinstance(title, str) and title.strip():
        return title.strip()
    return pdf_path.stem


def _extract_toc(reader: PdfReader) -> list[dict[str, Any]]:
    outline = getattr(reader, "outline", None)
    if outline is None:
        outline = getattr(reader, "outlines", None)
    if not outline:
        return []

    toc: list[dict[str, Any]] = []
    _walk_outline(reader, outline, toc, level=1, parent_id=None)
    return toc


def _walk_outline(
    reader: PdfReader,
    nodes: list[Any],
    toc: list[dict[str, Any]],
    *,
    level: int,
    parent_id: str | None,
) -> None:
    last_id: str | None = None

    for node in nodes:
        if isinstance(node, list):
            _walk_outline(
                reader,
                node,
                toc,
                level=level + 1,
                parent_id=last_id or parent_id,
            )
            continue

        title = _outline_title(node)
        if not title:
            continue

        entry_id = f"toc-{len(toc) + 1}"
        toc.append(
            {
                "id": entry_id,
                "title": title,
                "level": level,
                "parent_id": parent_id,
                "page_number": _outline_page_number(reader, node),
            }
        )
        last_id = entry_id


def _outline_title(node: Any) -> str:
    title = getattr(node, "title", None)
    if not title and hasattr(node, "get"):
        try:
            title = node.get("/Title")
        except Exception:
            title = None
    if not isinstance(title, str):
        return ""
    return re.sub(r"\s+", " ", title).strip()


def _outline_page_number(reader: PdfReader, node: Any) -> int | None:
    try:
        return int(reader.get_destination_page_number(node)) + 1
    except Exception:
        return None


def _normalize_metadata(metadata: Any) -> dict[str, Any]:
    if not metadata:
        return {}

    normalized: dict[str, Any] = {}
    for key, value in dict(metadata).items():
        clean_key = str(key).lstrip("/").strip().lower()
        normalized[clean_key] = _json_safe(value)
    return normalized


def _json_safe(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    return str(value)


def _infer_subject_label(stem: str) -> str:
    return re.sub(r"\s+", " ", stem.replace("_", " ").replace("-", " ")).strip()


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "unknown"


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
