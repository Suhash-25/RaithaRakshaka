"""Routes for browsing extracted textbook syllabus data."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from pv_app.config import get_settings
from pv_app.schemas import (
    SyllabusCatalogResponse,
    SyllabusClassDetail,
    SyllabusDocumentDetail,
    SyllabusSearchResponse,
    SyllabusSubjectDetail,
)
from pv_app.services.textbook_catalog import (
    TextbookCatalogNotFoundError,
    get_syllabus_catalog,
    get_syllabus_class,
    get_syllabus_subject,
    get_textbook_document,
    search_syllabus,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/syllabus",
    response_model=SyllabusCatalogResponse,
    summary="Get the extracted syllabus catalog",
    tags=["Syllabus"],
)
async def syllabus_catalog(board: str = Query("state", pattern="^(state|cbse)$")) -> SyllabusCatalogResponse:
    """Return the complete class → subject → document syllabus tree."""

    settings = get_settings()
    logger.info("syllabus_catalog | root=%s", settings.textbook_extracted_root)

    try:
        payload = get_syllabus_catalog(settings.textbook_extracted_root, board=board)
    except TextbookCatalogNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return SyllabusCatalogResponse(**payload)


@router.get(
    "/syllabus/classes/{class_slug}",
    response_model=SyllabusClassDetail,
    summary="Get one class and its syllabus subjects",
    tags=["Syllabus"],
)
async def syllabus_class(
    class_slug: str,
    board: str = Query("state", pattern="^(state|cbse)$"),
) -> SyllabusClassDetail:
    """Return a single class node with nested subject summaries."""

    settings = get_settings()
    logger.info("syllabus_class | class_slug=%s", class_slug)

    try:
        payload = get_syllabus_class(settings.textbook_extracted_root, class_slug, board=board)
    except TextbookCatalogNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if payload is None:
        raise HTTPException(status_code=404, detail=f"Class '{class_slug}' was not found.")

    return SyllabusClassDetail(**payload)


@router.get(
    "/syllabus/classes/{class_slug}/subjects/{subject_slug}",
    response_model=SyllabusSubjectDetail,
    summary="Get one canonical subject within a class",
    tags=["Syllabus"],
)
async def syllabus_subject(
    class_slug: str,
    subject_slug: str,
    board: str = Query("state", pattern="^(state|cbse)$"),
) -> SyllabusSubjectDetail:
    """Return one grouped subject and its underlying textbook documents."""

    settings = get_settings()
    logger.info("syllabus_subject | class_slug=%s subject_slug=%s", class_slug, subject_slug)

    try:
        payload = get_syllabus_subject(settings.textbook_extracted_root, class_slug, subject_slug, board=board)
    except TextbookCatalogNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if payload is None:
        raise HTTPException(
            status_code=404,
            detail=f"Subject '{subject_slug}' was not found in class '{class_slug}'.",
        )

    return SyllabusSubjectDetail(**payload)


@router.get(
    "/syllabus/documents/{document_id}",
    response_model=SyllabusDocumentDetail,
    summary="Get one extracted textbook document with TOC",
    tags=["Syllabus"],
)
async def syllabus_document(
    document_id: str,
    board: str = Query("state", pattern="^(state|cbse)$"),
) -> SyllabusDocumentDetail:
    """Return one textbook JSON plus a tree-shaped TOC."""

    settings = get_settings()
    logger.info("syllabus_document | document_id=%s", document_id)

    try:
        payload = get_textbook_document(settings.textbook_extracted_root, document_id, board=board)
    except TextbookCatalogNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if payload is None:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' was not found.")

    return SyllabusDocumentDetail(**payload)


@router.get(
    "/syllabus/search",
    response_model=SyllabusSearchResponse,
    summary="Search the extracted syllabus catalog",
    tags=["Syllabus"],
)
async def syllabus_search(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    board: str = Query("state", pattern="^(state|cbse)$"),
) -> SyllabusSearchResponse:
    """Search across classes, subjects, document titles, and chapter titles."""

    settings = get_settings()
    logger.info("syllabus_search | query=%s limit=%s", q, limit)

    try:
        payload = search_syllabus(settings.textbook_extracted_root, q, limit=limit, board=board)
    except TextbookCatalogNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return SyllabusSearchResponse(**payload)
