# ResumeReader — Reworked Implementation Plan

---

## Tool Status (Final)

| Tool | Status | Action |
|------|--------|--------|
| **RTK** | ✅ v0.39.0 | Ready — all commands proxied |
| **Graphify** | ✅ Installed | Antigravity rules written. Git hooks to install post-scaffold. |
| **PlanDB** | 🔨 Build required | Rust CLI — source at `plandb/`, binary at `plandb/target/debug/plandb.exe`. `cargo 1.90.0` confirmed installed. |
| **Python venv** | ✅ Python 3.11.9 | `.venv` at `ResumeReader/`, fresh — all deps to install here. |
| **Tesseract OCR** | ⚠️ Not found in PATH | Will install via `choco install tesseract` and use `pytesseract` wrapper in Python. |

---

## Dual-Mode Flow

### 🔑 Admin Flow

```
Admin creates Job → fills Job Description
         ↓
System generates: Job ID + Magic Link
         ↓
Admin dashboard table:
┌────────┬──────────────────┬───────┬─────────────────────────┐
│ Job ID │ Job Description  │ Score │ Magic Link               │
├────────┼──────────────────┼───────┼─────────────────────────┤
│ abc123 │ Senior Dev...    │  82   │ [Copy Link] [Revoke]     │
│ def456 │ Data Analyst...  │  —    │ [Copy Link] [Revoke]     │
└────────┴──────────────────┴───────┴─────────────────────────┘
```

Score column = latest match score (shows `—` if no resume submitted yet).

---

### 🎯 Candidate Flow (via Magic Link)

```
Candidate opens magic link (e.g. /apply/TOKEN)
         ↓
[Screen 1] Consent Gate
   "Your resume will be analyzed by AI to match this role.
    By proceeding, you agree to AI processing of your data."
   [I Agree — Continue] [Decline]
         ↓
[Screen 2] Resume Upload
   Drag-and-drop PDF/DOC/TXT
   AI processes (spinner: "Analyzing your resume...")
         ↓
       Score ≥ threshold (default 60)?
      /                              \
   YES (PASS)                    NO (FAIL)
      ↓                               ↓
[Screen 3a] 🎉 Pass!            [Screen 3b] ❌ Sorry
  "Great fit! Fill details        "Your resume currently
   to complete application"        lacks skills needed for
   Form: Name, Email, Phone,       this role. Consider
   LinkedIn, Portfolio URL          upskilling in: [gaps]"
   [Submit Application]
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                 Frontend — Vite + React + TypeScript          │
│   /dashboard (admin)  │  /apply/:token (candidate)            │
└─────────────────────────────┬────────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼────────────────────────────────┐
│                       FastAPI Backend                         │
│  /jobs  /apply/:token  /upload  /match  /applications         │
└──────┬────────────────────────────────────┬──────────────────┘
       │                                    │
┌──────▼───────────┐               ┌────────▼──────────┐
│  OCR Block Parser │               │  Gemini LLM API   │
│  (pytesseract +   │               │  - Extract JSON   │
│   pdf2image)      │               │  - Match + Score  │
│  Section detect:  │               │  - Skill gaps     │
│  Contact/Skills/  │               └────────┬──────────┘
│  Exp/Edu/Summary  │                        │
└──────┬───────────┘                        │
       │                                    │
┌──────▼────────────────────────────────────▼──────────┐
│              SQLite Database (managed by PlanDB CLI)  │
│    jobs  │  resumes  │  match_results  │  tokens      │
│                      │  applications                  │
└──────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────┐
│  PlanDB (Rust CLI)           │
│  plandb init                 │
│  plandb jobs list/show       │
│  plandb matches show <id>    │
│  plandb token revoke <tok>   │
│  plandb stats                │
└──────────────────────────────┘
```

---

## Proposed Changes

---

### Phase 1 — PlanDB (Rust CLI)

A lightweight Rust CLI that manages the SQLite database used by ResumeReader. Built with `rusqlite` + `clap`.

#### [NEW] `plandb/` — Rust project (sibling to ResumeReader/)

```
plandb/
├── Cargo.toml
└── src/
    ├── main.rs          ← clap CLI entry point
    ├── db.rs            ← SQLite connection + schema init
    ├── commands/
    │   ├── init.rs      ← CREATE TABLE statements
    │   ├── jobs.rs      ← list, show, delete jobs
    │   ├── matches.rs   ← show match result by job/resume
    │   ├── tokens.rs    ← list, revoke magic link tokens
    │   ├── stats.rs     ← summary: total jobs, matches, pass/fail rates
    │   └── export.rs    ← export match results to CSV/JSON
    └── models.rs        ← Rust structs mirroring DB tables
```

**Commands:**
```bash
plandb init                        # create DB schema
plandb jobs list                   # all jobs with score + token status
plandb jobs show <job_id>          # full job details + matches
plandb matches show <match_id>     # score, skills, summary
plandb token list                  # all active magic link tokens
plandb token revoke <token>        # invalidate a token
plandb stats                       # pass rate, avg score, counts
plandb export --format csv         # dump results to CSV
```

**Dependencies (Cargo.toml):**
- `clap` (v4, derive) — CLI arg parsing
- `rusqlite` + `bundled` feature — embedded SQLite, no server
- `serde`, `serde_json` — JSON serialization
- `chrono` — timestamps
- `colored` — terminal color output

---

### Phase 2 — FastAPI Backend

#### [NEW] `backend/` directory structure

```
backend/
├── main.py
├── config.py              ← .env loading, PASS_THRESHOLD (default 60)
├── database.py            ← SQLAlchemy sync engine on same SQLite file as plandb
├── models.py              ← ORM: Job, Resume, MatchResult, ShareToken, Application
├── schemas.py             ← Pydantic in/out models
├── routers/
│   ├── jobs.py            ← CRUD for jobs
│   ├── apply.py           ← candidate magic-link flow
│   ├── match.py           ← trigger analysis + return score
│   └── applications.py    ← save candidate form submissions
└── services/
    ├── ocr_parser.py      ← Block parser (see Phase 3)
    ├── extractor.py       ← Gemini: raw text → structured JSON
    ├── matcher.py         ← Gemini: JD + resume JSON → score + gaps
    └── magic_link.py      ← token gen, expiry, revoke
```

**Key Endpoints:**

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/jobs` | Admin | Create job, returns job_id + magic token |
| `GET` | `/jobs` | Admin | List all jobs with latest score |
| `GET` | `/jobs/{id}` | Admin | Job detail + match history |
| `GET` | `/apply/{token}` | Public | Validate token, return job title (no JD leak) |
| `POST` | `/apply/{token}/upload` | Public | Accept resume, run OCR → extract → match |
| `POST` | `/apply/{token}/apply` | Public | Save candidate form (only if PASS) |
| `DELETE` | `/tokens/{token}` | Admin | Revoke magic link |
| `GET` | `/admin/stats` | Admin | Aggregate stats |

---

### Phase 3 — OCR Block Parser (Python)

> [!IMPORTANT]
> This handles **scanned PDFs** (image-only), **photo resumes**, and **structured digital PDFs** uniformly via a block-detection pipeline.

#### Pipeline: `backend/services/ocr_parser.py`

```
Input: PDF / DOCX / TXT / PNG / JPG
          ↓
Step 1: Format Detection
   .pdf → try pdfplumber (digital text)
          if text_len < 100 chars → fallback to OCR
   .docx → python-docx
   .txt → raw read
   image → direct OCR
          ↓
Step 2: OCR (for image-based / scanned PDFs)
   pdf2image → convert pages to PIL Images
   pytesseract → extract text with layout (--psm 6)
          ↓
Step 3: Block / Section Detection
   Regex + heuristics to identify section headers:
   ┌─────────────────────────────────────────┐
   │ CONTACT INFO  → name, email, phone      │
   │ SUMMARY       → professional summary    │
   │ SKILLS        → tech stack list         │
   │ EXPERIENCE    → work history blocks     │
   │ EDUCATION     → degrees, institutions   │
   │ CERTIFICATIONS→ certs and courses       │
   │ PROJECTS      → portfolio items         │
   └─────────────────────────────────────────┘
          ↓
Step 4: Structured output dict
   {
     "contact": { "name": "...", "email": "..." },
     "summary": "...",
     "skills": ["Python", "React", ...],
     "experience": [{ "title": "...", "company": "...", "duration": "..." }],
     "education": [{ "degree": "...", "institution": "..." }]
   }
          ↓
Step 5: Pass to Gemini extractor for cleanup + enrichment
```

**Dependencies:**
- `pdfplumber` — digital PDF text extraction
- `pdf2image` — PDF page → PIL image (requires Poppler)
- `pytesseract` — OCR wrapper (requires Tesseract binary)
- `Pillow` — image handling
- `python-docx` — DOCX extraction
- `opencv-python` — image preprocessing (deskew, denoise)

---

### Phase 4 — Frontend (Vite + React + TypeScript)

**Design System:** Dark glassmorphism, purple→blue gradient, Inter font, smooth Framer Motion transitions.

#### [NEW] `frontend/` — Vite React app

```
frontend/src/
├── pages/
│   ├── Dashboard.tsx          ← Admin: jobs table (ID | JD | Score | Magic Link)
│   ├── CreateJob.tsx          ← Admin: JD form → create job → get link
│   ├── Apply.tsx              ← Candidate: router for magic link flow
│   ├── Consent.tsx            ← Step 1: AI consent gate
│   ├── ResumeUpload.tsx       ← Step 2: upload + loading spinner
│   ├── PassScreen.tsx         ← Step 3a: 🎉 + candidate details form
│   └── FailScreen.tsx         ← Step 3b: ❌ sorry + skill gaps shown
├── components/
│   ├── JobsTable.tsx          ← sortable table with copy-link + revoke
│   ├── ScoreGauge.tsx         ← animated circular score (0-100)
│   ├── SkillChips.tsx         ← matched (green) / missing (red) chips
│   ├── FileDropzone.tsx       ← drag-and-drop zone with preview
│   └── ConsentModal.tsx       ← consent checkbox gate
└── api/
    ├── jobs.ts
    ├── apply.ts
    └── admin.ts
```

#### Admin Dashboard — Jobs Table

```
┌─────────┬──────────────────────┬───────┬──────────────────────────────┐
│ Job ID  │ Job Description      │ Score │ Magic Link                   │
├─────────┼──────────────────────┼───────┼──────────────────────────────┤
│ abc123  │ Senior Python Dev... │  82%  │ 🔗 Copy  ⏱ 7d left  ❌ Revoke│
│ def456  │ Data Analyst...      │  —    │ 🔗 Copy  ⏱ 7d left  ❌ Revoke│
└─────────┴──────────────────────┴───────┴──────────────────────────────┘
```

---

### Phase 5 — Database Schema (shared by FastAPI + PlanDB)

```sql
CREATE TABLE jobs (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    threshold   INTEGER DEFAULT 60,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE share_tokens (
    token       TEXT PRIMARY KEY,
    job_id      TEXT REFERENCES jobs(id),
    revoked     INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME
);

CREATE TABLE resumes (
    id              TEXT PRIMARY KEY,
    token           TEXT REFERENCES share_tokens(token),
    filename        TEXT,
    raw_text        TEXT,
    structured_data TEXT,   -- JSON blocks: contact/skills/exp/edu
    uploaded_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE match_results (
    id              TEXT PRIMARY KEY,
    job_id          TEXT REFERENCES jobs(id),
    resume_id       TEXT REFERENCES resumes(id),
    score           INTEGER,
    matched_skills  TEXT,   -- JSON array
    missing_skills  TEXT,   -- JSON array
    summary         TEXT,
    passed          INTEGER,  -- 1=pass, 0=fail
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    id          TEXT PRIMARY KEY,
    match_id    TEXT REFERENCES match_results(id),
    name        TEXT,
    email       TEXT,
    phone       TEXT,
    linkedin    TEXT,
    portfolio   TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Project Layout (Final)

```
c:\Users\xtrem\Downloads\python_proj\
├── plandb/                        ← [NEW] Rust CLI project
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       ├── db.rs
│       ├── models.rs
│       └── commands/
│
└── ResumeReader/
    ├── .venv/                     ← Python 3.11 venv
    ├── .agent/                    ← graphify rules
    ├── backend/
    │   ├── main.py
    │   ├── config.py
    │   ├── database.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── routers/
    │   │   ├── jobs.py
    │   │   ├── apply.py
    │   │   ├── match.py
    │   │   └── applications.py
    │   └── services/
    │       ├── ocr_parser.py      ← Block parser (OCR pipeline)
    │       ├── extractor.py       ← Gemini extraction
    │       ├── matcher.py         ← Gemini scoring
    │       └── magic_link.py
    ├── frontend/
    │   ├── src/
    │   │   ├── pages/
    │   │   ├── components/
    │   │   └── api/
    │   └── vite.config.ts
    ├── .env
    ├── requirements.txt
    └── start.bat                  ← starts backend + frontend
```

---

## Python Dependencies (`requirements.txt`)

```
fastapi
uvicorn[standard]
sqlalchemy
python-multipart
aiofiles
python-dotenv
google-generativeai
pdfplumber
pdf2image
pytesseract
Pillow
opencv-python
python-docx
```

**System-level:**
- Tesseract OCR binary: `choco install tesseract`
- Poppler (for pdf2image): `choco install poppler`

---

## Build & Run Order

```bash
# 1. Build PlanDB
cd C:\Users\xtrem\Downloads\python_proj\plandb
cargo build
# → binary at plandb/target/debug/plandb.exe

# 2. Init database
plandb.exe init --db ../ResumeReader/resumereader.db

# 3. Install Python deps
cd ..\ResumeReader
.\.venv\Scripts\pip install -r requirements.txt

# 4. Install Tesseract + Poppler (system-level, admin PS)
choco install tesseract poppler -y

# 5. Start backend
.\.venv\Scripts\uvicorn backend.main:app --reload

# 6. Build + start frontend
cd frontend && npm install && npm run dev

# OR: use start.bat (automates all of the above)
```

---

## Verification Plan

### Automated
- `plandb stats` — shows DB tables populated
- `GET /docs` — Swagger shows all routes
- `POST /jobs` → returns `job_id` + `magic_link_token`
- Admin table renders with Job ID, JD preview, Score (`—`), Magic Link
- `GET /apply/{token}` → returns job title (consent screen renders)
- `POST /apply/{token}/upload` with scanned PDF → OCR blocks extracted
- Score ≥ 60 → PassScreen + candidate form visible
- Score < 60 → FailScreen with missing skills listed
- `POST /apply/{token}/apply` → application saved to DB
- `plandb token revoke <token>` → link shows "expired" on frontend

### Manual / Browser
- Open magic link in incognito → consent screen shows
- Upload a weak resume → FailScreen with skill gaps
- Upload a strong resume → PassScreen with form
- Admin revokes token → candidate gets "Link expired" message
