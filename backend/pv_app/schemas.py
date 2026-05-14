"""
schemas.py — Pydantic request / response models for all API routes.
No business logic lives here — only data contracts.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, model_validator


# ─── Shared ───────────────────────────────────────────────────────────────────

class ContentType(str, Enum):
    question    = "question"
    explanation = "explanation"


# ─── /analyze-response ────────────────────────────────────────────────────────

class MisconceptionCategory(str, Enum):
    concept_misunderstanding = "Concept misunderstanding"
    partial_understanding = "Partial understanding"
    wrong_logic_application = "Wrong logic application"
    rote_memorization = "Rote memorization"
    language_misunderstanding = "Language misunderstanding"


class ConfidenceLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class AnalyzeResponseRequest(BaseModel):
    """Payload sent when a student submits a free-text answer."""

    question:       str | None = Field(None, description="Question shown to the student")
    question_text:  str | None = Field(None, description="Backward-compatible question field")
    student_answer: str | None = Field(None, description="Student's written or transcribed answer")
    answer_text:    str | None = Field(None, description="Alternate answer field")
    answer:         str | None = Field(None, description="Alternate answer field")
    subject:        str | None = Field(None, description="Optional subject slug, for example physics")
    question_id:    str | None = Field(None, description="Optional question identifier")
    topic_id:       str | None = Field(None, description="Optional topic identifier")
    selected_index: int | None = Field(None, ge=0, description="Legacy MCQ selected option index")
    correct_index:  int | None = Field(None, ge=0, description="Legacy MCQ correct option index")
    options:        list[str]  = Field(default_factory=list, description="Legacy MCQ options")

    @model_validator(mode="after")
    def normalize_payload(self) -> "AnalyzeResponseRequest":
        if not self.question and self.question_text:
            self.question = self.question_text

        if not self.student_answer:
            if self.answer_text:
                self.student_answer = self.answer_text
            elif self.answer:
                self.student_answer = self.answer
            elif self.selected_index is not None and self.selected_index < len(self.options):
                self.student_answer = self.options[self.selected_index]

        if not self.question or not self.question.strip():
            raise ValueError("question is required")
        if not self.student_answer or not self.student_answer.strip():
            raise ValueError("student_answer is required")
        return self


class MisconceptionDetail(BaseModel):
    """Describes a detected misconception."""

    type:             MisconceptionCategory = Field(..., description="Misconception category")
    description:      str                   = Field(..., description="Human-readable explanation")
    confidence:       float                 = Field(..., ge=0.0, le=1.0, description="Confidence [0-1]")
    confidence_level: ConfidenceLevel       = Field(..., description="Bucketed confidence label")
    rule_id:          str                   = Field("", description="Matched rule identifier")
    matched_keywords: list[str]             = Field(default_factory=list)
    matched_patterns: list[str]             = Field(default_factory=list)
    missing_concepts: list[str]             = Field(default_factory=list)


class AnalyzeResponseResult(BaseModel):
    """Response from the analysis endpoint."""

    question_id:           str | None
    subject:               str
    misconception_type:    MisconceptionCategory
    confidence_level:      ConfidenceLevel
    confidence:            float = Field(..., ge=0.0, le=1.0)
    misconceptions:        list[MisconceptionDetail] = Field(default_factory=list)
    corrective_guidance:   str = ""
    explanation_available: bool = False
    is_correct:            bool | None = None
    analysis_method:       str = "offline_rule_engine"
    execution_ms:          float = Field(..., ge=0.0)


# ─── /generate-explanation ───────────────────────────────────────────────────

class GenerateExplanationRequest(BaseModel):
    """Payload to request an offline stored explanation."""

    misconception_type: MisconceptionCategory | None = Field(None, description="Detected misconception category")
    topic:              str | None            = Field(None, description="Topic label or slug")
    topic_id:           str | None            = Field(None, description="Topic slug")
    subject:            str | None            = Field(None, description="Optional subject slug")
    question_id:        str | None            = Field(None)
    question_text:      str | None            = Field(None)
    student_answer:     str | None            = Field(None, description="The student's answer text")
    include_visual:     bool                  = Field(True, description="Whether to include a diagram")

    @model_validator(mode="after")
    def require_analysis_input(self) -> "GenerateExplanationRequest":
        has_answer_context = bool(self.question_text and self.student_answer)
        if not self.misconception_type and not has_answer_context:
            raise ValueError("misconception_type or question_text + student_answer is required")
        return self


class ExplanationResult(BaseModel):
    """Structured stored explanation returned to the frontend."""

    type:               str  = Field(..., pattern="^(visual|story|hybrid)$")
    content:            str  = Field(..., description="Simplified explanation")
    diagram:            str  = Field("", description="SVG markup, data URI, or static path")
    story:              str  = Field("", description="Story-based analogy")
    topic:              str
    misconception_type: MisconceptionCategory
    source:             str = "stored_json"
    enhanced_by_ai:     bool = False
    online_used:        bool = False
    ai_provider:        str | None = None
    question_id:        str | None = None
    generated_at:       float = Field(..., description="Unix timestamp of retrieval")


class LocalExplanationRequest(BaseModel):
    """Payload for local Ollama explanation enhancement."""

    topic:              str                  = Field(..., description="Topic label or slug")
    misconception_type: MisconceptionCategory | None = Field(None)
    content:            str                  = Field(..., description="Explanation text to rephrase")
    story:              str                  = Field("", description="Existing analogy to improve")
    use_case:           str                  = Field("hybrid", pattern="^(rephrase|analogy|hybrid)$")


class LocalExplanationResult(BaseModel):
    """Result from optional local Ollama enhancement."""

    skipped:       bool
    reason:        str = ""
    provider:      str = "ollama"
    model:         str
    content:       str
    story:         str = ""
    enhanced:      bool = False
    execution_ms:  float = Field(..., ge=0.0)


# ─── /validate-content ───────────────────────────────────────────────────────

class ValidateContentRequest(BaseModel):
    """Payload for content validation before storage."""

    content_type: ContentType = Field(...)
    content:      Any         = Field(..., description="The content object to validate")


class ValidationIssue(BaseModel):
    field:   str
    message: str


class ValidateContentResult(BaseModel):
    """Validation outcome."""

    is_valid: bool
    issues:   list[ValidationIssue] = []
    message:  str                   = ""


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:  str = "ok"
    version: str
    env:     str


# --- /syllabus ---

class SyllabusSubjectRef(BaseModel):
    label: str
    slug: str


class SyllabusTocEntry(BaseModel):
    id: str
    title: str
    level: int = Field(..., ge=1)
    parent_id: str | None = None
    page_number: int | None = Field(None, ge=1)


class SyllabusTocNode(BaseModel):
    id: str
    title: str
    level: int = Field(..., ge=1)
    parent_id: str | None = None
    page_number: int | None = Field(None, ge=1)
    children: list["SyllabusTocNode"] = Field(default_factory=list)


class SyllabusDocumentSummary(BaseModel):
    document_id: str
    document_title: str
    class_label: str
    class_slug: str
    subject_label: str
    subject_slug: str
    subject: SyllabusSubjectRef
    document_kind: str = Field(..., pattern="^(textbook|reader|workbook)$")
    part_number: int | None = Field(None, ge=1)
    part_label: str = ""
    page_count: int = Field(..., ge=0)
    has_toc: bool = False
    toc_entry_count: int = Field(..., ge=0)
    chapter_count: int = Field(..., ge=0)
    toc_quality: str = Field(..., pattern="^(none|page_index|flat|structured)$")
    file_name: str
    relative_pdf_path: str
    output_json_path: str
    file_size_bytes: int = Field(..., ge=0)
    modified_at: str


class SyllabusClassDetail(BaseModel):
    class_label: str
    class_slug: str
    subject_count: int = Field(..., ge=0)
    document_count: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
    toc_document_count: int = Field(..., ge=0)
    chapter_count: int = Field(..., ge=0)
    subjects: list["SyllabusSubjectDetail"] = Field(default_factory=list)


class SyllabusSubjectDetail(BaseModel):
    class_label: str
    class_slug: str
    subject_label: str
    subject_slug: str
    document_count: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
    toc_document_count: int = Field(..., ge=0)
    chapter_count: int = Field(..., ge=0)
    documents: list[SyllabusDocumentSummary] = Field(default_factory=list)


class SyllabusCatalogResponse(BaseModel):
    generated_at: str
    extracted_root: str
    class_count: int = Field(..., ge=0)
    subject_count: int = Field(..., ge=0)
    document_count: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
    classes: list[SyllabusClassDetail] = Field(default_factory=list)


class SyllabusDocumentSource(BaseModel):
    file_name: str
    relative_pdf_path: str
    absolute_pdf_path: str
    file_size_bytes: int = Field(..., ge=0)
    modified_at: str
    sha256: str | None = None


class SyllabusDocumentCurriculum(BaseModel):
    class_label: str
    class_slug: str
    subject_label: str
    subject_slug: str
    document_title: str
    subject: SyllabusSubjectRef


class SyllabusDocumentPdfInfo(BaseModel):
    page_count: int = Field(..., ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)
    has_toc: bool = False
    toc_quality: str = Field(..., pattern="^(none|page_index|flat|structured)$")
    toc_entry_count: int = Field(..., ge=0)
    chapter_count: int = Field(..., ge=0)


class SyllabusDocumentDetail(SyllabusDocumentSummary):
    extracted_at: str
    source: SyllabusDocumentSource
    curriculum: SyllabusDocumentCurriculum
    pdf: SyllabusDocumentPdfInfo
    toc: list[SyllabusTocEntry] = Field(default_factory=list)
    toc_tree: list[SyllabusTocNode] = Field(default_factory=list)


class SyllabusSearchResult(BaseModel):
    document_id: str
    document_title: str
    class_label: str
    class_slug: str
    subject_label: str
    subject_slug: str
    match_type: str = Field(..., pattern="^(document|subject|class|chapter)$")
    matched_text: str
    page_number: int | None = Field(None, ge=1)


class SyllabusSearchResponse(BaseModel):
    query: str
    result_count: int = Field(..., ge=0)
    results: list[SyllabusSearchResult] = Field(default_factory=list)


SyllabusTocNode.model_rebuild()
SyllabusSubjectDetail.model_rebuild()
SyllabusClassDetail.model_rebuild()
