"""
routes/local_explanation.py - /local-explanation endpoint.

Uses local Ollama/Mistral to rephrase explanations or generate analogies.
If Ollama or the model is unavailable, the endpoint returns the original text
with skipped=true instead of failing.
"""

import logging

from fastapi import APIRouter

from pv_ai.router import local_ollama_explanation
from pv_app.config import get_settings
from pv_app.schemas import LocalExplanationRequest, LocalExplanationResult


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/local-explanation",
    response_model=LocalExplanationResult,
    summary="Enhance explanation with local Ollama",
    tags=["Local AI"],
)
async def local_explanation(payload: LocalExplanationRequest) -> LocalExplanationResult:
    """Rephrase explanation text or generate a local analogy with Ollama."""

    logger.info(
        "local_explanation | topic=%s use_case=%s",
        payload.topic,
        payload.use_case,
    )

    result = await local_ollama_explanation(
        topic=payload.topic,
        content=payload.content,
        story=payload.story,
        use_case=payload.use_case,
        misconception_type=payload.misconception_type,
        settings=get_settings(),
    )

    return LocalExplanationResult(**result)
