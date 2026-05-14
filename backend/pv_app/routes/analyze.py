"""
routes/analyze.py - /analyze-response endpoint.

Runs fully offline rule-based misconception detection for a question and
student answer. No backend model provider is called.
"""

import logging

from fastapi import APIRouter

from pv_app.schemas import AnalyzeResponseRequest, AnalyzeResponseResult
from pv_app.services.misconception_engine import analyze_student_response

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/analyze-response",
    response_model=AnalyzeResponseResult,
    summary="Analyze a student response for misconceptions",
    tags=["Analysis"],
)
async def analyze_response(payload: AnalyzeResponseRequest) -> AnalyzeResponseResult:
    """
    Receives a question and student answer, then returns the strongest
    misconception category plus confidence using local JSON rules.
    """

    logger.info(
        "analyze_response | question_id=%s topic=%s subject=%s",
        payload.question_id,
        payload.topic_id,
        payload.subject or "auto",
    )

    analysis = analyze_student_response(
        question=payload.question or "",
        student_answer=payload.student_answer or "",
        subject=payload.subject,
    )

    is_correct = None
    if payload.selected_index is not None and payload.correct_index is not None:
        is_correct = payload.selected_index == payload.correct_index

    return AnalyzeResponseResult(
        question_id=payload.question_id,
        subject=analysis["subject"],
        misconception_type=analysis["misconception_type"],
        confidence_level=analysis["confidence_level"],
        confidence=analysis["confidence"],
        misconceptions=analysis["misconceptions"],
        corrective_guidance=analysis["corrective_guidance"],
        explanation_available=False,
        is_correct=is_correct,
        execution_ms=analysis["execution_ms"],
    )
