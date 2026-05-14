"""Offline explanation lookup engine.

Explanations are pre-stored as JSON under backend/secondary/<subject>/explanations.json.
The lookup is intentionally small and cached so endpoint calls stay fast.
"""

from __future__ import annotations

import json
import time
from functools import lru_cache
from pathlib import Path
from typing import Any

from pv_app.schemas import MisconceptionCategory


EXPLANATION_ROOT = Path(__file__).resolve().parents[2] / "secondary"
EXPLANATION_FILE = "explanations.json"


def get_explanation(
    misconception_type: MisconceptionCategory,
    topic: str | None = None,
    topic_id: str | None = None,
    subject: str | None = None,
) -> dict[str, Any]:
    """Return the best stored explanation for a misconception/topic pair."""

    topic_key = _normalize(topic_id or topic or "general")
    subject_key = _normalize(subject) if subject else None
    packs = [_load_pack(subject_key)] if subject_key else _load_all_packs()

    explanation = _find_exact(packs, misconception_type, topic_key)
    if explanation is None:
        explanation = _find_general(packs, misconception_type, topic_key)
    if explanation is None:
        explanation = _fallback_explanation(misconception_type, topic_key)

    return {
        "type": explanation.get("type", "hybrid"),
        "content": explanation.get("content", ""),
        "diagram": explanation.get("diagram", ""),
        "story": explanation.get("story", ""),
        "topic": explanation.get("topic", topic_key),
        "misconception_type": misconception_type,
        "generated_at": time.time(),
    }


def _find_exact(
    packs: list[dict[str, Any]],
    misconception_type: MisconceptionCategory,
    topic_key: str,
) -> dict[str, Any] | None:
    for pack in packs:
        for item in pack.get("explanations", []):
            if _normalize(item.get("topic")) == topic_key and item.get("misconception_type") == misconception_type:
                return item
    return None


def _find_general(
    packs: list[dict[str, Any]],
    misconception_type: MisconceptionCategory,
    topic_key: str,
) -> dict[str, Any] | None:
    for pack in packs:
        for item in pack.get("explanations", []):
            if item.get("misconception_type") == misconception_type:
                return {**item, "topic": topic_key}
    return None


def _fallback_explanation(
    misconception_type: MisconceptionCategory,
    topic_key: str,
) -> dict[str, Any]:
    return {
        "type": "hybrid",
        "topic": topic_key,
        "misconception_type": misconception_type,
        "content": "Start with the core idea, then connect it to the question in one clear reasoning step.",
        "story": "Think of the topic like following a recipe: naming an ingredient is not enough; the order and reason for using it matter.",
        "diagram": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 180'><rect width='520' height='180' rx='18' fill='#0f172a'/><g fill='none' stroke='#2dd4bf' stroke-width='4'><path d='M75 90h120'/><path d='M195 90l-18-14m18 14l-18 14'/><path d='M245 90h120'/><path d='M365 90l-18-14m18 14l-18 14'/></g><g fill='#e2e8f0' font-family='Inter,Arial' font-size='18' text-anchor='middle'><text x='80' y='96'>Idea</text><text x='260' y='96'>Reason</text><text x='430' y='96'>Answer</text></g></svg>",
    }


def _normalize(value: str | None) -> str:
    return (value or "").strip().lower().replace("_", "-").replace(" ", "-")


@lru_cache(maxsize=32)
def _load_pack(subject: str) -> dict[str, Any]:
    path = EXPLANATION_ROOT / subject / EXPLANATION_FILE
    if not path.exists():
        return {"subject": subject, "explanations": []}
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


@lru_cache(maxsize=1)
def _load_all_packs() -> list[dict[str, Any]]:
    packs = []
    for path in sorted(EXPLANATION_ROOT.glob(f"*/{EXPLANATION_FILE}")):
        with path.open("r", encoding="utf-8") as file:
            packs.append(json.load(file))
    return packs
