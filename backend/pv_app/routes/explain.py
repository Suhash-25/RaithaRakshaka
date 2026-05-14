"""
routes/explain.py - /generate-explanation endpoint.

Returns pre-stored explanations, optionally enhanced by DeepSeek.
"""

import logging

from fastapi import APIRouter

from pv_ai.router import enhance_explanation
from pv_app.config import get_settings
from pv_app.schemas import GenerateExplanationRequest, ExplanationResult
from pv_app.services.misconception_engine import analyze_student_response
from pv_app.services.explanation_engine import get_explanation

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/generate-explanation",
    response_model=ExplanationResult,
    summary="Get a hybrid offline/AI explanation for a misconception",
    tags=["Explanation"],
)
async def generate_explanation(payload: GenerateExplanationRequest) -> ExplanationResult:
    """Run local detection first, then return local or AI-enhanced explanation."""

    logger.info(
        "generate_explanation | topic=%s misconception=%s subject=%s",
        payload.topic_id or payload.topic,
        payload.misconception_type or "auto",
        payload.subject or "auto",
    )

    misconception_type = payload.misconception_type
    subject = payload.subject

    if payload.question_text and payload.student_answer:
        analysis = analyze_student_response(
            question=payload.question_text,
            student_answer=payload.student_answer,
            subject=payload.subject,
        )
        misconception_type = analysis["misconception_type"]
        subject = analysis["subject"]

    local_explanation = get_explanation(
        misconception_type=misconception_type,
        topic=payload.topic,
        topic_id=payload.topic_id,
        subject=subject,
    )

    explanation = await enhance_explanation(
        local_explanation=local_explanation,
        misconception_type=misconception_type,
        topic=payload.topic_id or payload.topic or local_explanation["topic"],
        question=payload.question_text,
        student_answer=payload.student_answer,
        settings=get_settings(),
    )

    return ExplanationResult(
        question_id=payload.question_id,
        type=explanation["type"],
        content=explanation["content"],
        diagram=explanation["diagram"] if payload.include_visual else "",
        story=explanation["story"],
        topic=explanation["topic"],
        misconception_type=explanation["misconception_type"],
        source=explanation["source"],
        enhanced_by_ai=explanation["enhanced_by_ai"],
        online_used=explanation["online_used"],
        ai_provider=explanation["ai_provider"],
        generated_at=explanation["generated_at"],
    )
