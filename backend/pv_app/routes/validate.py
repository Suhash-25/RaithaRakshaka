"""
routes/validate.py — /validate-content endpoint.

Validates questions and explanations before they are stored in IndexedDB / DB.
Actual validation rules will grow in future sprints.
"""

import logging
from fastapi import APIRouter

from pv_app.schemas import (
    ContentType,
    ValidateContentRequest,
    ValidateContentResult,
    ValidationIssue,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── Field requirements per content type ─────────────────────────────────────

REQUIRED_QUESTION_FIELDS    = {"id", "text", "type", "options", "correctIndex", "topicId", "subjectId"}
REQUIRED_EXPLANATION_FIELDS = {"questionId", "content"}


@router.post(
    "/validate-content",
    response_model=ValidateContentResult,
    summary="Validate generated content before storage",
    tags=["Validation"],
)
async def validate_content(payload: ValidateContentRequest) -> ValidateContentResult:
    """
    Checks that a question or explanation object meets the required schema
    before it is written to IndexedDB on the frontend.

    **TODO (Sprint 2):** Add deeper semantic validation (answer count, language check, etc.)
    """
    logger.info("validate_content | content_type=%s", payload.content_type)

    issues: list[ValidationIssue] = []

    if not isinstance(payload.content, dict):
        return ValidateContentResult(
            is_valid=False,
            issues=[ValidationIssue(field="content", message="Content must be a JSON object.")],
            message="Validation failed.",
        )

    # ── Field presence check ──────────────────────────
    if payload.content_type == ContentType.question:
        required = REQUIRED_QUESTION_FIELDS
    else:
        required = REQUIRED_EXPLANATION_FIELDS

    for field in required:
        if field not in payload.content:
            issues.append(ValidationIssue(field=field, message=f"'{field}' is required."))

    is_valid = len(issues) == 0
    return ValidateContentResult(
        is_valid=is_valid,
        issues=issues,
        message="Validation passed." if is_valid else f"{len(issues)} issue(s) found.",
    )
