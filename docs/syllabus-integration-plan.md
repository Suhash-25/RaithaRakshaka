# Syllabus Integration Plan

## Current baseline

The repo already has the right first-stage primitives:

- `backend/extract_textbooks.py` scans the dataset root and generates one JSON file per PDF.
- `backend/app/services/textbook_extraction.py` stores source metadata, PDF metadata, and bookmark-based TOC data.
- `backend/app/services/textbook_catalog.py` builds a cached class -> subject -> document catalog and exposes search helpers.
- `backend/app/routes/syllabus.py` already serves catalog, class, subject, document, and search endpoints.
- The frontend selection, class, and subject dashboards already consume the extracted syllabus APIs.

What is still incomplete is the second half of the pipeline:

- The learning flow is still partly backed by static topic data in `frontend/src/data/learningCatalog.js`.
- Many PDFs do not expose bookmark outlines, so bookmark-only extraction does not cover the whole syllabus.
- Document-level chapter visualization was missing before `frontend/src/pages/TopicsPage.jsx`.

## What the dataset should become

Use a two-stage pipeline instead of parsing PDFs on every request.

### Stage 1: deterministic extraction

Source:

- `dataset/Class I/*.pdf`
- `dataset/Class II/*.pdf`
- ...
- `dataset/Class XII/*.pdf`

Output:

- one extracted JSON per PDF under `backend/generated/textbooks/<class>/<subject>/<document>.json`
- one manifest file describing the extraction run

Extract in this stage:

- class label and slug
- subject label and canonical subject slug
- document title
- document kind: textbook, workbook, reader
- part number if present
- page count
- source file metadata: size, modified time, optional SHA-256
- raw PDF metadata
- embedded TOC or bookmark outline when available

This stage should stay fast, idempotent, and deterministic.

### Stage 2: enrichment for missing structure

This is the critical next step because the current dataset is mixed:

- 116 documents total
- 49 documents with embedded TOC/bookmarks
- 67 documents without embedded TOC
- current derived TOC quality counts: `none=67`, `flat=33`, `structured=15`, `page_index=1`

For documents without usable bookmarks, add an enrichment pass that:

- extracts page text with layout awareness
- detects chapter headings from typography, numbering, repeated patterns, and page positions
- infers chapter page ranges
- optionally infers subtopics from heading levels inside the chapter
- writes an enriched JSON payload or a sibling index file

Recommended tools:

- `pypdf`: fast metadata + bookmark extraction
- `pdfplumber` or `PyMuPDF`: layout-aware text extraction and heading detection
- `pytesseract` or `EasyOCR`: only for scanned/image PDFs that have no text layer

Do not OCR everything by default. Only OCR files that fail normal text extraction.

## Recommended data model

Keep the storage hierarchy file-first for now, then optionally mirror into a database when progress, search, and analytics need stronger querying.

### Canonical hierarchy

`Board -> Class -> Subject -> Document -> Chapter -> Topic`

### Suggested JSON contract

Each document should eventually expose:

```json
{
  "document_id": "class-ix--science-textbook",
  "board": {
    "id": "state",
    "label": "State Board"
  },
  "curriculum": {
    "class_label": "Class IX",
    "class_slug": "class-ix",
    "subject_label": "Science Textbook",
    "subject_slug": "science",
    "document_title": "KSEEB Class 9 Science Textbook"
  },
  "document": {
    "kind": "textbook",
    "part_number": 1,
    "page_count": 184
  },
  "toc": [],
  "chapters": [
    {
      "chapter_id": "matter-in-our-surroundings",
      "title": "Matter in Our Surroundings",
      "order": 1,
      "start_page": 1,
      "end_page": 18,
      "topics": [
        {
          "topic_id": "states-of-matter",
          "title": "States of Matter",
          "order": 1,
          "start_page": 2,
          "end_page": 5
        }
      ]
    }
  ]
}
```

Important distinction:

- `toc` is the raw extracted outline
- `chapters` is the normalized curriculum structure your app should consume

That separation lets you improve extraction quality later without breaking frontend contracts.

## Backend architecture

### Keep PDF parsing out of request paths

Do not parse PDFs at runtime for regular API traffic.

Reason:

- predictable latency
- easier caching
- simpler debugging
- safer deployment
- reusable artifacts for search, analytics, and offline sync

Runtime PDF parsing should only exist in:

- CLI extraction jobs
- admin reprocessing endpoints if you later add them

### Recommended backend modules

- `textbook_extraction.py`
  - stage 1 metadata + TOC extraction
- `textbook_enrichment.py`
  - heading inference, chapter normalization, OCR fallback
- `textbook_catalog.py`
  - cached aggregate catalog for API responses
- `textbook_search.py`
  - search index building and query logic
- `progress_service.py`
  - learner progress overlay by chapter/topic/document
- `analytics_service.py`
  - class-wise and subject-wise rollups for dashboards

### API shape to aim for

Already present:

- `GET /api/v1/syllabus`
- `GET /api/v1/syllabus/classes/:classSlug`
- `GET /api/v1/syllabus/classes/:classSlug/subjects/:subjectSlug`
- `GET /api/v1/syllabus/documents/:documentId`
- `GET /api/v1/syllabus/search?q=...`

Add next:

- `GET /api/v1/syllabus/documents/:documentId/chapters`
- `GET /api/v1/syllabus/chapters/:chapterId`
- `GET /api/v1/syllabus/topics/:topicId`
- `GET /api/v1/analytics/syllabus-overview`
- `GET /api/v1/progress/syllabus`

## Search strategy

Phase 1 is already enough for a lightweight catalog search:

- class label
- subject label
- document title
- TOC titles

Phase 2 should add normalized chapter/topic search against enriched data.

Best options:

- small scale: JSON-backed in-memory index with cache invalidation from manifest mtime
- medium scale: SQLite with FTS5
- larger multi-user scale: PostgreSQL plus trigram/full-text search

For this codebase, SQLite FTS5 is the best next step if you want persistent search without introducing infrastructure.

## Frontend visual roadmap

### Already available

- class-level syllabus overview
- subject distribution by pages
- document coverage view
- local student progress dashboard

### Added now

- document-level interactive chapter tree at `classes/:classSlug/subjects/:subjectSlug/documents/:documentId`

### Next high-value visuals

1. Full syllabus tree

- expandable class -> subject -> document -> chapter -> topic navigator
- virtualized rendering if the tree becomes large

2. Subject distribution charts

- pages per subject
- chapters per subject
- TOC coverage per subject

3. Progress overlay

- chapter completion percentages
- document completion ring
- subject heatmap by mastery

4. Study planning visuals

- recommended timeline by remaining chapters
- weekly study workload chart
- upcoming revision queue

5. Search-driven navigation

- global search bar that jumps directly to class, subject, chapter, or topic nodes

## Caching and performance

Current `TextbookCatalogService` caching by manifest mtime is the right start.

Add next:

- per-document normalized chapter cache
- search index cache keyed by manifest mtime or content hash
- optional precomputed analytics JSON for heavy dashboards
- lazy frontend fetching for document detail pages

Avoid:

- loading full page text for every document into every catalog response
- returning complete chapter trees inside the root syllabus endpoint

Use summaries for list views and detail endpoints for deep trees.

## Progress tracking integration

Your current progress system is local and event-based. Keep that approach, but align it with the syllabus dataset keys.

Persist progress against:

- `class_slug`
- `subject_slug`
- `document_id`
- `chapter_id`
- `topic_id`

That lets you compute:

- chapter completion percentage
- subject completion percentage
- class completion percentage
- weak chapter heatmaps
- revision recommendations

## Recommended rollout order

1. Finish replacing static subject/topic assumptions with syllabus-driven document and chapter views.
2. Add the enrichment stage for PDFs without embedded TOC.
3. Introduce normalized `chapters` and `topics` in the extracted artifacts.
4. Attach progress records to chapter/topic IDs instead of static catalog topics.
5. Add search and analytics endpoints over the enriched data.
6. Build the full curriculum tree and completion dashboards on top of those stable APIs.

## Immediate next tasks in this repo

1. Replace remaining `learningCatalog.js` dependencies in topic/question flows with syllabus-backed chapter/topic IDs.
2. Add `textbook_enrichment.py` for heading inference on the 67 TOC-less PDFs.
3. Add normalized chapter/topic schemas to `backend/app/schemas.py`.
4. Add a search UI on the selection or subject pages using the existing `/syllabus/search` endpoint.
5. Extend progress tracking so completion can be visualized per document, chapter, and topic.
