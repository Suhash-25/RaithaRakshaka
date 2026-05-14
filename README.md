# Pragna Vistara (formerly Edu-Sakhi)

AI-powered educational platform for **Classes 9 to 12** — featuring misconception detection, visual learning, offline-first study sessions, and a comprehensive, high-quality, topic-specific question bank.

## Content Architecture & Workflow

The platform has transitioned from generic, template-driven questions to a **Universal Educational Curriculum** built on highly structured, subject-specific catalogs. This ensures that questions reflect genuine technical depth and mirror the scaffolded structure of board exams (CBSE/NCERT).

### 1. Catalog Registry System
All educational content is organized into dedicated Javascript files categorized by class and subject (e.g., `catalogs/class-12/chemistry.js`).
- **Lazy Loading**: To ensure high performance, subject catalogs are lazy-loaded via `frontend/src/data/catalogRegistry.js`. (Class 12 Physics is eagerly loaded as the benchmark).
- **Universal Rendering**: The frontend routing and UI components (`SubjectChaptersPage`, `SubjectLearningPage`) are completely subject-agnostic. They read the active catalog from the registry and dynamically render the topics and questions.

### 2. Catalog Data Schema
Every chapter in a catalog file is broken down into specific topics. Each topic contains structured arrays of:
- **MCQ**: Multiple-choice questions with explicit `correctIndex` and `explanation`.
- **Numerical**: Calculation-based questions with expected `answer`, `unit`, step-by-step `solution`, and `hint`.
- **Questions (Conceptual)**: Deep-dive theory questions. The student's free-text answer is evaluated by the AI against an array of `expectedConcepts`.
- **Misconceptions**: Specialized probes designed to catch common student errors. The AI evaluates student responses against `detectKeywords` and provides a predefined `correction`.

### 3. File Structure
```text
frontend/src/data/
├── catalogRegistry.js             # Central registry and loader
├── learningCatalog.js             # Subject metadata, icons, and colors
└── catalogs/
    ├── class-12/
    │   ├── chemistry.js           # E.g., Solutions, Electrochemistry
    │   ├── mathematics.js         # E.g., Calculus, Algebra
    │   ├── biology.js             # E.g., Genetics, Ecology
    │   └── english.js             # E.g., Flamingo, Vistas
    ├── class-11/ ...
    └── class-10/ ...
```

## Tech Stack

| Layer    | Technology                           |
|----------|--------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS + PWA |
| Backend  | FastAPI (Python 3.11+)               |
| Storage  | IndexedDB (offline) via `idb`        |

## Project Structure

```text
Edu-Sakhi/
├── frontend/                  # React + Vite PWA
│   ├── src/
│   │   ├── components/        # Layout, Navbar, UI elements
│   │   ├── data/              # Content architecture (catalogs)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Subject pages, learning interfaces
│   │   ├── services/          # API client
│   │   └── utils/             # IndexedDB utilities
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                   # FastAPI server
│   ├── app/
│   │   ├── routes/            # AI analysis endpoints
│   │   ├── config.py          # Environment settings
│   │   └── schemas.py         # Request/response validation
│   ├── main.py                # Server entry point
│   └── requirements.txt
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
python main.py           # http://localhost:8000
```

## Roadmap

- [x] Phase 1 — Core App Scaffolding (React + FastAPI)
- [x] Phase 2 — Transition to Pragna Vistara Branding
- [x] Phase 3 — Universal Content Architecture & Catalog Registry
- [ ] Phase 4 — AI Integration (Gemini for conceptual evaluation)
- [ ] Phase 5 — Visual diagram generation
- [ ] Phase 6 — Authentication & Teacher Dashboard