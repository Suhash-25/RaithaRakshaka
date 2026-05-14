"""Catalog helpers for serving extracted textbook JSON files."""

from __future__ import annotations

import json
import re
from pathlib import Path
from threading import Lock
from typing import Any


TOC_QUALITY_NONE = "none"
TOC_QUALITY_PAGE_INDEX = "page_index"
TOC_QUALITY_FLAT = "flat"
TOC_QUALITY_STRUCTURED = "structured"

_ROMAN_NUMERAL_RE = re.compile(r"\b(?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\b", re.IGNORECASE)
_PART_RE = re.compile(r"\bpart\s*[-:]?\s*(\d+)\b", re.IGNORECASE)
_TRAILING_NUMBER_RE = re.compile(r"(\d+)\s*$")
_PAGE_TITLE_RE = re.compile(r"^page\s+\d+$", re.IGNORECASE)
_WHITESPACE_RE = re.compile(r"\s+")
_NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


class TextbookCatalogNotFoundError(FileNotFoundError):
    """Raised when the extracted textbook layer is unavailable."""


class TextbookCatalogService:
    """Loads and caches the extracted textbook catalog."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._cached_root: Path | None = None
        self._cached_mtime: float | None = None
        self._catalog: dict[str, Any] | None = None

    def load(self, extracted_root: Path) -> dict[str, Any]:
        extracted_root = extracted_root.resolve()
        manifest_path = extracted_root / "manifest.json"
        if not manifest_path.exists():
            raise TextbookCatalogNotFoundError(
                f"Extracted textbook manifest not found at {manifest_path}"
            )

        manifest_mtime = manifest_path.stat().st_mtime
        with self._lock:
            if (
                self._catalog is not None
                and self._cached_root == extracted_root
                and self._cached_mtime == manifest_mtime
            ):
                return self._catalog

            catalog = _build_catalog(extracted_root, manifest_path)
            self._cached_root = extracted_root
            self._cached_mtime = manifest_mtime
            self._catalog = catalog
            return catalog


_catalog_service = TextbookCatalogService()


def get_textbook_catalog(extracted_root: Path) -> dict[str, Any]:
    return _catalog_service.load(extracted_root)


def get_syllabus_catalog(extracted_root: Path) -> dict[str, Any]:
    catalog = get_textbook_catalog(extracted_root)
    return {
        "generated_at": catalog["generated_at"],
        "extracted_root": catalog["extracted_root"],
        "class_count": catalog["class_count"],
        "subject_count": catalog["subject_count"],
        "document_count": catalog["document_count"],
        "total_pages": catalog["total_pages"],
        "classes": catalog["classes"],
    }


def get_syllabus_class(extracted_root: Path, class_slug: str) -> dict[str, Any] | None:
    catalog = get_textbook_catalog(extracted_root)
    return catalog["classes_by_slug"].get(class_slug)


def get_syllabus_subject(
    extracted_root: Path,
    class_slug: str,
    subject_slug: str,
) -> dict[str, Any] | None:
    catalog = get_textbook_catalog(extracted_root)
    return catalog["subjects_by_key"].get((class_slug, subject_slug))


def get_textbook_document(extracted_root: Path, document_id: str) -> dict[str, Any] | None:
    catalog = get_textbook_catalog(extracted_root)
    return catalog["documents_by_id"].get(document_id)


def search_syllabus(
    extracted_root: Path,
    query: str,
    *,
    limit: int = 20,
) -> dict[str, Any]:
    catalog = get_textbook_catalog(extracted_root)
    needle = _normalize_text(query)
    if not needle:
        return {"query": query, "result_count": 0, "results": []}

    results: list[dict[str, Any]] = []
    for document in catalog["documents"]:
        document_detail = catalog["documents_by_id"][document["document_id"]]

        document_matches = _search_text_matches(
            needle,
            [
                ("document", document["document_title"], 120, None),
                ("subject", document["subject"]["label"], 100, None),
                ("subject", document["subject_label"], 90, None),
                ("class", document["class_label"], 80, None),
            ],
        )
        if document_matches:
            best_match = max(document_matches, key=lambda item: item["score"])
            results.append(_build_search_result(document, best_match))

        for toc_entry in document_detail["toc"]:
            toc_title = toc_entry.get("title") or ""
            if needle in _normalize_text(toc_title):
                results.append(
                    _build_search_result(
                        document,
                        {
                            "match_type": "chapter",
                            "matched_text": toc_title,
                            "page_number": toc_entry.get("page_number"),
                            "score": 70,
                        },
                    )
                )

    deduped: dict[tuple[str, str, str | None], dict[str, Any]] = {}
    for result in results:
        key = (result["document_id"], result["match_type"], result["matched_text"])
        current = deduped.get(key)
        if current is None or result["score"] > current["score"]:
            deduped[key] = result

    ranked = sorted(
        deduped.values(),
        key=lambda item: (-item["score"], item["class_label"], item["subject_label"], item["document_title"]),
    )[: max(limit, 1)]

    for result in ranked:
        result.pop("score", None)

    return {
        "query": query,
        "result_count": len(ranked),
        "results": ranked,
    }


def _build_catalog(extracted_root: Path, manifest_path: Path) -> dict[str, Any]:
    manifest = _read_json(manifest_path)
    class_map: dict[str, dict[str, Any]] = {}
    documents: list[dict[str, Any]] = []
    documents_by_id: dict[str, dict[str, Any]] = {}

    total_pages = 0
    subject_total = 0

    for manifest_document in manifest.get("documents", []):
        output_json_path = str(manifest_document.get("output_json_path", "")).replace("\\", "/")
        if not output_json_path:
            continue

        document_path = extracted_root / output_json_path
        if not document_path.exists():
            continue

        document_payload = _read_json(document_path)
        document_summary = _build_document_summary(document_payload, output_json_path)
        document_detail = _build_document_detail(document_payload, document_summary)

        documents.append(document_summary)
        documents_by_id[document_summary["document_id"]] = document_detail
        total_pages += document_summary["page_count"]

        class_entry = class_map.setdefault(
            document_summary["class_slug"],
            {
                "class_label": document_summary["class_label"],
                "class_slug": document_summary["class_slug"],
                "subjects_map": {},
            },
        )
        subject_key = document_summary["subject"]["slug"]
        subject_entry = class_entry["subjects_map"].setdefault(
            subject_key,
            {
                "class_label": document_summary["class_label"],
                "class_slug": document_summary["class_slug"],
                "subject_label": document_summary["subject"]["label"],
                "subject_slug": document_summary["subject"]["slug"],
                "document_count": 0,
                "total_pages": 0,
                "toc_document_count": 0,
                "chapter_count": 0,
                "documents": [],
            },
        )
        subject_entry["document_count"] += 1
        subject_entry["total_pages"] += document_summary["page_count"]
        subject_entry["toc_document_count"] += 1 if document_summary["has_toc"] else 0
        subject_entry["chapter_count"] += document_summary["chapter_count"]
        subject_entry["documents"].append(document_summary)

    classes: list[dict[str, Any]] = []
    classes_by_slug: dict[str, dict[str, Any]] = {}
    subjects_by_key: dict[tuple[str, str], dict[str, Any]] = {}

    for class_entry in sorted(class_map.values(), key=lambda item: _class_sort_key(item["class_label"])):
        subjects: list[dict[str, Any]] = []
        for subject_entry in sorted(
            class_entry["subjects_map"].values(),
            key=lambda item: item["subject_label"].lower(),
        ):
            subject_entry["documents"] = sorted(
                subject_entry["documents"],
                key=_document_sort_key,
            )
            subjects.append(subject_entry)
            subjects_by_key[(subject_entry["class_slug"], subject_entry["subject_slug"])] = subject_entry
            subject_total += 1

        class_detail = {
            "class_label": class_entry["class_label"],
            "class_slug": class_entry["class_slug"],
            "subject_count": len(subjects),
            "document_count": sum(subject["document_count"] for subject in subjects),
            "total_pages": sum(subject["total_pages"] for subject in subjects),
            "toc_document_count": sum(subject["toc_document_count"] for subject in subjects),
            "chapter_count": sum(subject["chapter_count"] for subject in subjects),
            "subjects": subjects,
        }
        classes.append(class_detail)
        classes_by_slug[class_detail["class_slug"]] = class_detail

    return {
        "generated_at": manifest.get("generated_at", ""),
        "extracted_root": str(extracted_root),
        "class_count": len(classes),
        "subject_count": subject_total,
        "document_count": len(documents),
        "total_pages": total_pages,
        "classes": classes,
        "classes_by_slug": classes_by_slug,
        "subjects_by_key": subjects_by_key,
        "documents": sorted(documents, key=_document_catalog_sort_key),
        "documents_by_id": documents_by_id,
    }


def _build_document_summary(document: dict[str, Any], output_json_path: str) -> dict[str, Any]:
    curriculum = document.get("curriculum", {})
    source = document.get("source", {})
    pdf = document.get("pdf", {})
    toc = document.get("toc") or []

    raw_subject_label = str(curriculum.get("subject_label") or source.get("file_name") or "Unknown Subject")
    subject_label = _canonical_subject_label(raw_subject_label)
    subject_slug = _slugify(subject_label)
    document_kind = _infer_document_kind(raw_subject_label)
    part_number = _infer_part_number(raw_subject_label)
    toc_quality = _infer_toc_quality(toc)
    chapter_count = _count_chapters(toc, toc_quality)

    return {
        "document_id": str(document.get("document_id") or ""),
        "document_title": str(curriculum.get("document_title") or source.get("file_name") or "Untitled"),
        "class_label": str(curriculum.get("class_label") or "Unknown Class"),
        "class_slug": str(curriculum.get("class_slug") or "unknown-class"),
        "subject_label": raw_subject_label,
        "subject_slug": str(curriculum.get("subject_slug") or "unknown-subject"),
        "subject": {
            "label": subject_label,
            "slug": subject_slug,
        },
        "document_kind": document_kind,
        "part_number": part_number,
        "part_label": f"Part {part_number}" if part_number else "",
        "page_count": int(pdf.get("page_count") or 0),
        "has_toc": bool(pdf.get("has_toc")),
        "toc_entry_count": len(toc),
        "chapter_count": chapter_count,
        "toc_quality": toc_quality,
        "file_name": str(source.get("file_name") or ""),
        "relative_pdf_path": str(source.get("relative_pdf_path") or ""),
        "output_json_path": output_json_path,
        "file_size_bytes": int(source.get("file_size_bytes") or 0),
        "modified_at": str(source.get("modified_at") or ""),
    }


def _build_document_detail(document: dict[str, Any], summary: dict[str, Any]) -> dict[str, Any]:
    toc = [_normalize_toc_entry(entry) for entry in (document.get("toc") or [])]
    toc_tree = _build_toc_tree(toc)
    pdf = dict(document.get("pdf") or {})

    curriculum = dict(document.get("curriculum") or {})
    curriculum["subject"] = summary["subject"]

    pdf["toc_quality"] = summary["toc_quality"]
    pdf["toc_entry_count"] = summary["toc_entry_count"]
    pdf["chapter_count"] = summary["chapter_count"]

    detail = dict(summary)
    detail.update(
        {
            "extracted_at": str(document.get("extracted_at") or ""),
            "source": dict(document.get("source") or {}),
            "curriculum": curriculum,
            "pdf": pdf,
            "toc": toc,
            "toc_tree": toc_tree,
        }
    )
    return detail


def _normalize_toc_entry(entry: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(entry.get("id") or ""),
        "title": str(entry.get("title") or ""),
        "level": int(entry.get("level") or 1),
        "parent_id": entry.get("parent_id"),
        "page_number": entry.get("page_number"),
    }


def _build_toc_tree(toc: list[dict[str, Any]]) -> list[dict[str, Any]]:
    nodes: dict[str, dict[str, Any]] = {}
    roots: list[dict[str, Any]] = []

    for entry in toc:
        nodes[entry["id"]] = {
            **entry,
            "children": [],
        }

    for entry in toc:
        node = nodes[entry["id"]]
        parent_id = entry.get("parent_id")
        parent = nodes.get(parent_id) if isinstance(parent_id, str) else None
        if parent is None:
            roots.append(node)
        else:
            parent["children"].append(node)

    return roots


def _count_chapters(toc: list[dict[str, Any]], toc_quality: str) -> int:
    if toc_quality == TOC_QUALITY_NONE:
        return 0
    if toc_quality == TOC_QUALITY_PAGE_INDEX:
        return 0
    return sum(1 for entry in toc if entry.get("parent_id") in (None, ""))


def _infer_toc_quality(toc: list[dict[str, Any]]) -> str:
    if not toc:
        return TOC_QUALITY_NONE

    titles = [str(entry.get("title") or "").strip() for entry in toc]
    page_title_hits = sum(1 for title in titles if _PAGE_TITLE_RE.fullmatch(title))
    if page_title_hits / max(len(titles), 1) >= 0.7:
        return TOC_QUALITY_PAGE_INDEX

    has_nested_levels = any(int(entry.get("level") or 1) > 1 for entry in toc)
    if has_nested_levels:
        return TOC_QUALITY_STRUCTURED

    return TOC_QUALITY_FLAT


def _canonical_subject_label(raw_subject_label: str) -> str:
    label = raw_subject_label
    label = re.sub(r"\bactivity\s+cum\s+reader\b", "", label, flags=re.IGNORECASE)
    label = re.sub(r"\b(textbook|workbook|reader)\b", "", label, flags=re.IGNORECASE)
    label = _PART_RE.sub("", label)
    label = _ROMAN_NUMERAL_RE.sub("", label)
    label = _TRAILING_NUMBER_RE.sub("", label)
    label = _WHITESPACE_RE.sub(" ", label).strip(" -")
    return label or raw_subject_label.strip() or "Unknown Subject"


def _infer_document_kind(raw_subject_label: str) -> str:
    lowered = raw_subject_label.lower()
    if "workbook" in lowered:
        return "workbook"
    if "reader" in lowered:
        return "reader"
    return "textbook"


def _infer_part_number(raw_subject_label: str) -> int | None:
    part_match = _PART_RE.search(raw_subject_label)
    if part_match:
        return int(part_match.group(1))

    trailing_match = _TRAILING_NUMBER_RE.search(raw_subject_label)
    if trailing_match and "class " not in raw_subject_label.lower():
        return int(trailing_match.group(1))

    return None


def _build_search_result(document: dict[str, Any], match: dict[str, Any]) -> dict[str, Any]:
    return {
        "document_id": document["document_id"],
        "document_title": document["document_title"],
        "class_label": document["class_label"],
        "class_slug": document["class_slug"],
        "subject_label": document["subject"]["label"],
        "subject_slug": document["subject"]["slug"],
        "match_type": match["match_type"],
        "matched_text": match["matched_text"],
        "page_number": match.get("page_number"),
        "score": match["score"],
    }


def _search_text_matches(
    needle: str,
    candidates: list[tuple[str, str, int, int | None]],
) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    for match_type, text, base_score, page_number in candidates:
        normalized = _normalize_text(text)
        if not normalized or needle not in normalized:
            continue
        score = base_score + (15 if normalized.startswith(needle) else 0)
        matches.append(
            {
                "match_type": match_type,
                "matched_text": text,
                "page_number": page_number,
                "score": score,
            }
        )
    return matches


def _document_sort_key(document: dict[str, Any]) -> tuple[int, int, str]:
    kind_order = {"textbook": 0, "reader": 1, "workbook": 2}
    return (
        kind_order.get(document.get("document_kind", "textbook"), 9),
        int(document.get("part_number") or 0),
        str(document.get("document_title") or "").lower(),
    )


def _document_catalog_sort_key(document: dict[str, Any]) -> tuple[tuple[int, str], str, tuple[int, int, str]]:
    return (
        _class_sort_key(document["class_label"]),
        document["subject"]["label"].lower(),
        _document_sort_key(document),
    )


def _class_sort_key(class_label: str) -> tuple[int, str]:
    match = re.search(r"(\d+)", class_label)
    if match:
        return (int(match.group(1)), class_label.lower())

    roman_match = _ROMAN_NUMERAL_RE.search(class_label)
    if roman_match:
        return (_roman_to_int(roman_match.group(0)), class_label.lower())

    return (999, class_label.lower())


def _roman_to_int(value: str) -> int:
    numerals = {"i": 1, "v": 5, "x": 10}
    total = 0
    previous = 0
    for char in reversed(value.lower()):
        current = numerals.get(char, 0)
        if current < previous:
            total -= current
        else:
            total += current
            previous = current
    return total


def _slugify(value: str) -> str:
    slug = _NON_ALNUM_RE.sub("-", value.lower()).strip("-")
    return slug or "unknown"


def _normalize_text(value: str) -> str:
    return _WHITESPACE_RE.sub(" ", value.strip().lower())


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))
