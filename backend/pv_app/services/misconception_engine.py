"""Offline rule-based misconception detection.

The engine loads subject-specific JSON rule files from backend/secondary.
It uses keyword matching, regular expression patterns, and missing concept
checks only. No network calls or model providers are used.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from pv_app.schemas import ConfidenceLevel, MisconceptionCategory


RULE_ROOT = Path(__file__).resolve().parents[2] / "secondary"
RULE_FILE = "rules.json"


@dataclass(frozen=True)
class RuleMatch:
    subject: str
    rule_id: str
    category: MisconceptionCategory
    description: str
    confidence: float
    guidance: str
    matched_keywords: list[str]
    matched_patterns: list[str]
    missing_concepts: list[str]


def analyze_student_response(
    question: str,
    student_answer: str,
    subject: str | None = None,
) -> dict[str, Any]:
    """Analyze a student answer using local JSON rules."""

    started_at = time.perf_counter()
    normalized_subject = _normalize_subject(subject) if subject else None
    packs = _load_rule_packs(normalized_subject)

    matches: list[RuleMatch] = []
    for pack in packs:
        matches.extend(_match_pack(pack, question, student_answer))

    matches.sort(key=lambda item: item.confidence, reverse=True)
    if matches:
        primary = matches[0]
        details = [_detail(match) for match in matches[:3]]
        guidance = primary.guidance or _default_guidance(primary.category)
    else:
        primary = _fallback_match(packs, question, student_answer)
        details = [_detail(primary)]
        guidance = _default_guidance(primary.category)

    execution_ms = round((time.perf_counter() - started_at) * 1000, 3)
    return {
        "subject": primary.subject,
        "misconception_type": primary.category,
        "confidence_level": _confidence_level(primary.confidence),
        "confidence": primary.confidence,
        "misconceptions": details,
        "corrective_guidance": guidance,
        "execution_ms": execution_ms,
    }


def _detail(match: RuleMatch) -> dict[str, Any]:
    return {
        "type": match.category,
        "description": match.description,
        "confidence": match.confidence,
        "confidence_level": _confidence_level(match.confidence),
        "rule_id": match.rule_id,
        "matched_keywords": match.matched_keywords,
        "matched_patterns": match.matched_patterns,
        "missing_concepts": match.missing_concepts,
    }


def _match_pack(pack: dict[str, Any], question: str, student_answer: str) -> list[RuleMatch]:
    subject = _normalize_subject(pack.get("subject") or "unknown")
    rules = pack.get("rules", [])
    matches: list[RuleMatch] = []

    for rule in rules:
        question_keywords = rule.get("question_keywords", [])
        question_hits = _hits(question, question_keywords)
        if question_keywords and not question_hits:
            continue

        answer_hits = _hits(student_answer, rule.get("answer_keywords", []))
        pattern_hits = _pattern_hits(student_answer, rule.get("answer_patterns", []))
        missing = _missing_concepts(student_answer, rule.get("missing_concepts", []))
        missing_only = bool(missing) and not answer_hits and not pattern_hits

        if rule.get("requires_answer_match", False) and not answer_hits and not pattern_hits:
            continue
        if missing_only and not rule.get("allow_missing_only", False):
            continue
        if not answer_hits and not pattern_hits and not missing:
            continue

        confidence = _score(rule, answer_hits, pattern_hits, missing, question_hits)
        matches.append(
            RuleMatch(
                subject=subject,
                rule_id=rule.get("id", ""),
                category=MisconceptionCategory(rule["misconception_type"]),
                description=rule.get("description", ""),
                confidence=confidence,
                guidance=rule.get("guidance", ""),
                matched_keywords=answer_hits,
                matched_patterns=pattern_hits,
                missing_concepts=missing,
            )
        )

    return matches


def _score(
    rule: dict[str, Any],
    answer_hits: list[str],
    pattern_hits: list[str],
    missing: list[str],
    question_hits: list[str],
) -> float:
    base = float(rule.get("confidence", 0.45))
    boost = (
        min(len(answer_hits), 4) * 0.07
        + min(len(pattern_hits), 3) * 0.12
        + min(len(missing), 3) * 0.06
        + min(len(question_hits), 2) * 0.03
    )
    return round(max(0.0, min(base + boost, 0.98)), 2)


def _fallback_match(
    packs: list[dict[str, Any]],
    question: str,
    student_answer: str,
) -> RuleMatch:
    subject = _infer_subject(packs, question)
    token_count = len(_tokens(student_answer))
    category = (
        MisconceptionCategory.partial_understanding
        if token_count < 12
        else MisconceptionCategory.concept_misunderstanding
    )
    confidence = 0.34 if token_count < 12 else 0.4
    return RuleMatch(
        subject=subject,
        rule_id="fallback_low_signal",
        category=category,
        description="No strong rule matched; the answer has low rule-based evidence and should be reviewed.",
        confidence=confidence,
        guidance="Ask the student to restate the idea with the key concept, reasoning step, and final conclusion.",
        matched_keywords=[],
        matched_patterns=[],
        missing_concepts=[],
    )


def _default_guidance(category: MisconceptionCategory) -> str:
    guidance = {
        MisconceptionCategory.concept_misunderstanding: (
            "Revisit the core definition and connect it to a simple example."
        ),
        MisconceptionCategory.partial_understanding: (
            "Build on the correct part, then ask for the missing concept and reasoning step."
        ),
        MisconceptionCategory.wrong_logic_application: (
            "Check which rule or formula applies before substituting values."
        ),
        MisconceptionCategory.rote_memorization: (
            "Ask for an explanation in words, not only a memorized term or formula."
        ),
        MisconceptionCategory.language_misunderstanding: (
            "Clarify the wording of the question and identify exactly what is being asked."
        ),
    }
    return guidance[category]


def _confidence_level(confidence: float) -> ConfidenceLevel:
    if confidence >= 0.75:
        return ConfidenceLevel.high
    if confidence >= 0.5:
        return ConfidenceLevel.medium
    return ConfidenceLevel.low


def _hits(text: str, phrases: list[str]) -> list[str]:
    return [phrase for phrase in phrases if _contains(text, phrase)]


def _pattern_hits(text: str, patterns: list[str]) -> list[str]:
    normalized = _normalize_text(text)
    hits = []
    for pattern in patterns:
        try:
            if re.search(pattern, normalized, flags=re.IGNORECASE):
                hits.append(pattern)
        except re.error:
            continue
    return hits


def _missing_concepts(text: str, concepts: list[str]) -> list[str]:
    return [concept for concept in concepts if not _contains(text, concept)]


def _contains(text: str, phrase: str) -> bool:
    normalized_text = _normalize_text(text)
    normalized_phrase = _normalize_text(phrase)
    if not normalized_phrase:
        return False
    if " " in normalized_phrase:
        return normalized_phrase in normalized_text
    return re.search(rf"\b{re.escape(normalized_phrase)}\b", normalized_text) is not None


def _tokens(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", _normalize_text(text))


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _normalize_subject(subject: str | None) -> str:
    return _normalize_text(subject or "unknown").replace("_", "-").replace(" ", "-")


def _infer_subject(packs: list[dict[str, Any]], question: str) -> str:
    best_subject = "unknown"
    best_score = 0
    for pack in packs:
        score = 0
        for rule in pack.get("rules", []):
            score += len(_hits(question, rule.get("question_keywords", [])))
        if score > best_score:
            best_score = score
            best_subject = _normalize_subject(pack.get("subject"))
    return best_subject


def _load_rule_packs(subject: str | None) -> list[dict[str, Any]]:
    if subject:
        return [_load_rule_pack(subject)]
    return _load_all_rule_packs()


@lru_cache(maxsize=32)
def _load_rule_pack(subject: str) -> dict[str, Any]:
    path = RULE_ROOT / subject / RULE_FILE
    if not path.exists():
        return {"subject": subject, "rules": []}
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


@lru_cache(maxsize=1)
def _load_all_rule_packs() -> list[dict[str, Any]]:
    packs = []
    for path in sorted(RULE_ROOT.glob(f"*/{RULE_FILE}")):
        with path.open("r", encoding="utf-8") as file:
            packs.append(json.load(file))
    return packs
