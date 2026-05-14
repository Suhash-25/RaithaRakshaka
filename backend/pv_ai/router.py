"""Optional DeepSeek enhancement layer.

The offline rule engine and stored explanation are always used first. DeepSeek
only improves the explanation text when a key and internet access are present.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

import httpx

from pv_app.config import Settings
from pv_app.schemas import MisconceptionCategory


logger = logging.getLogger(__name__)


async def local_ollama_explanation(
    topic: str,
    content: str,
    story: str,
    use_case: str,
    misconception_type: MisconceptionCategory | None,
    settings: Settings,
) -> dict[str, Any]:
    """Enhance explanation text with local Ollama/Mistral when available."""

    started_at = time.perf_counter()
    fallback = {
        "skipped": True,
        "reason": "",
        "provider": "ollama",
        "model": settings.ollama_model,
        "content": content,
        "story": story,
        "enhanced": False,
        "execution_ms": 0.0,
    }

    if not settings.ollama_enabled:
        return _with_elapsed(fallback | {"reason": "ollama_disabled"}, started_at)

    if not await _ollama_model_available(settings):
        return _with_elapsed(fallback | {"reason": "model_not_available"}, started_at)

    enhanced = await _call_ollama_generate(
        topic=topic,
        content=content,
        story=story,
        use_case=use_case,
        misconception_type=misconception_type,
        settings=settings,
    )
    if not enhanced:
        return _with_elapsed(fallback | {"reason": "generation_failed"}, started_at)

    return _with_elapsed(
        {
            **fallback,
            "skipped": False,
            "reason": "",
            "content": enhanced.get("content") or content,
            "story": enhanced.get("story") or story,
            "enhanced": True,
        },
        started_at,
    )


async def _ollama_model_available(settings: Settings) -> bool:
    try:
        async with httpx.AsyncClient(timeout=min(settings.ollama_timeout, 2.0)) as client:
            response = await client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.info("Ollama unavailable: %s", exc)
        return False

    models = response.json().get("models", [])
    wanted = settings.ollama_model
    wanted_base = wanted.split(":")[0]
    for model in models:
        name = str(model.get("name", ""))
        if name == wanted or name.split(":")[0] == wanted_base:
            return True
    return False


async def _call_ollama_generate(
    topic: str,
    content: str,
    story: str,
    use_case: str,
    misconception_type: MisconceptionCategory | None,
    settings: Settings,
) -> dict[str, str] | None:
    prompt = _ollama_prompt(topic, content, story, use_case, misconception_type)
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.35,
            "num_predict": 180,
            "num_ctx": 1024,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout) as client:
            response = await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/generate",
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.info("Ollama generation skipped: %s", exc)
        return None

    try:
        generated = response.json().get("response", "")
        parsed = json.loads(generated)
    except (TypeError, json.JSONDecodeError) as exc:
        logger.info("Ollama response could not be parsed: %s", exc)
        return None

    if not isinstance(parsed, dict):
        return None

    return {
        "content": str(parsed.get("content", "")).strip(),
        "story": str(parsed.get("story", "")).strip(),
    }


def _ollama_prompt(
    topic: str,
    content: str,
    story: str,
    use_case: str,
    misconception_type: MisconceptionCategory | None,
) -> str:
    return (
        "Return only valid JSON with keys content and story.\n"
        "Audience: secondary school student. Keep it simple and fast.\n"
        f"Use case: {use_case}\n"
        f"Topic: {topic}\n"
        f"Misconception: {misconception_type or 'unknown'}\n"
        f"Explanation to rephrase: {content}\n"
        f"Existing analogy: {story}\n"
        "Rules: content <= 55 words. story <= 55 words. No markdown."
    )


def _with_elapsed(result: dict[str, Any], started_at: float) -> dict[str, Any]:
    return {
        **result,
        "execution_ms": round((time.perf_counter() - started_at) * 1000, 3),
    }


async def enhance_explanation(
    local_explanation: dict[str, Any],
    misconception_type: MisconceptionCategory,
    topic: str,
    question: str | None,
    student_answer: str | None,
    settings: Settings,
) -> dict[str, Any]:
    """Return local explanation, optionally enhanced by DeepSeek."""

    result = {
        **local_explanation,
        "source": "stored_json",
        "enhanced_by_ai": False,
        "online_used": False,
        "ai_provider": None,
    }

    if not settings.deepseek_enabled or not settings.deepseek_api_key:
        return result

    if not await is_internet_available(settings):
        return result

    enhanced = await _call_deepseek(
        local_explanation=local_explanation,
        misconception_type=misconception_type,
        topic=topic,
        question=question,
        student_answer=student_answer,
        settings=settings,
    )
    if not enhanced:
        return result

    return {
        **result,
        "content": enhanced.get("content") or result.get("content", ""),
        "story": enhanced.get("story") or result.get("story", ""),
        "source": "deepseek",
        "enhanced_by_ai": True,
        "online_used": True,
        "ai_provider": "deepseek",
    }


async def is_internet_available(settings: Settings) -> bool:
    """Check whether DeepSeek is reachable before making the model call."""

    try:
        async with httpx.AsyncClient(timeout=min(settings.deepseek_timeout, 2.5)) as client:
            response = await client.get(settings.deepseek_base_url)
            return response.status_code < 500
    except httpx.HTTPError:
        return False


async def _call_deepseek(
    local_explanation: dict[str, Any],
    misconception_type: MisconceptionCategory,
    topic: str,
    question: str | None,
    student_answer: str | None,
    settings: Settings,
) -> dict[str, str] | None:
    url = f"{settings.deepseek_base_url.rstrip('/')}/chat/completions"
    prompt = {
        "topic": topic,
        "misconception_type": str(misconception_type),
        "question": question or "",
        "student_answer": student_answer or "",
        "local_content": local_explanation.get("content", ""),
        "local_story": local_explanation.get("story", ""),
    }

    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You improve short student explanations for secondary school. "
                    "Return only JSON with keys content and story. "
                    "Keep it simple, warm, and under 70 words per field."
                ),
            },
            {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
        ],
        "response_format": {"type": "json_object"},
        "thinking": {"type": "disabled"},
        "stream": False,
        "temperature": 0.4,
        "max_tokens": 350,
    }

    try:
        async with httpx.AsyncClient(timeout=settings.deepseek_timeout) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.deepseek_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.info("DeepSeek enhancement skipped: %s", exc)
        return None

    try:
        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        logger.info("DeepSeek response could not be parsed: %s", exc)
        return None

    if not isinstance(parsed, dict):
        return None

    enhanced_content = str(parsed.get("content", "")).strip()
    enhanced_story = str(parsed.get("story", "")).strip()
    if not enhanced_content and not enhanced_story:
        return None

    return {
        "content": enhanced_content,
        "story": enhanced_story,
    }
