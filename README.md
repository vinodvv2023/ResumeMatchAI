# ResumeMatch Platform 🚀

**Intend and pain point of recruiters** what happens when you post job requirements on Linkedin, you end up getting 100s of resume applications which further you have to screen manually which is very time consuming and tiring process - majority of candidate resume doesn't match with job description.

**ResumeMatch** is an end-to-end applicant tracking and resume screening platform powered by local machine learning. It provides recruiters with a premium dashboard to manage job openings and distributes secure, magic-link portals to candidates. When candidates apply, the platform uses a local OCR and NLP engine to instantly extract their skills, match them against the Job Description, and determine if they pass the required threshold—all without sending sensitive data to external LLMs.

## 🌟 Key Features

- **100% Local Privacy:** No external APIs (like OpenAI or Claude) are used for resume parsing. Uses local `pdfplumber`, `tesseract`, and `scikit-learn` TF-IDF algorithms.
- **Dual-Role Workflow:**
  - **Admin Dashboard:** Create and manage Jobs (Full CRUD), set passing thresholds, and generate Candidate Magic Links.
  - **Candidate Portal:** A beautifully crafted, glassmorphic UI where candidates upload their resumes and receive instant feedback.
- **Application Registry:** A historical record of all processed resumes, scores, and application statuses, allowing recruiters to track historical performance and candidate data.
- **Magic Link Security:** Single-use UUID links that grant candidates access to a specific job application without needing user accounts.
- **Cloud-Ready & Scalable:** Full support for **Neon PostgreSQL** and prepared for seamless deployment on **Blaxel.ai** via integrated Docker and agent manifests.
- **Rust-Powered Database:** The `PlanDB` CLI wrapper provides lightning-fast SQLite schema management for local development.
- **Premium Frontend UI:** Built with React, Vite, Tailwind CSS (v4), and Framer Motion for a stunning, glassmorphism-inspired aesthetic.

---

## 🛠️ Architecture

The platform consists of three core components:

1.  **Resume CLI (Rust):** A compiled Rust CLI (`resume_cli`) that initializes and manages the SQLite database (`resumereader.db`) for local use.
2.  **Backend API (FastAPI / Python):** Handles magic link generation, secure routing, File I/O, OCR block parsing, and NLP Skill Matching algorithms. Supports both SQLite and PostgreSQL (Neon).
3.  **Frontend Web App (React / TypeScript):** A modern SPA that provides the interactive Dashboards and Application Portals.

---

## 📦 Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- Rust (Cargo)
- Tesseract OCR (Installed and added to your system PATH for scanned PDF support)
- Poppler (For PDF-to-Image extraction)

### 1. Database Setup

#### Option A: Local SQLite (Fastest)
```bash
cd resume_cli
cargo build
.\target\debug\resume_cli.exe init
```

#### Option B: Cloud PostgreSQL (Neon)
1.  Create a project on [Neon.tech](https://neon.tech).
2.  Copy your `DATABASE_URL` to the `.env` file in the project root.
3.  Run the initial migration found in `docs/migrations/001_initial_schema.sql` via the Neon SQL Editor.

### 2. Backend Setup

```bash
cd ResumeReader/backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r ../requirements.txt
```

### 3. Frontend Setup

```bash
cd ResumeReader/frontend
npm install
```

---

## 🚀 How to Run

For a quick one-click startup, a `start.bat` file is provided in the root `ResumeReader` directory.

```bash
cd ResumeReader
.\start.bat
```

- **Admin Dashboard:** `http://localhost:5173`
- **Backend API Docs:** `http://localhost:8000/docs`

---

## 📖 Complete Workflow & Use Case

**Scenario:** A tech company is urgently hiring for a **"Senior Python Backend Developer"** and wants to automatically filter out resumes that don't match the core requirements.

1.  The recruiter opens the Admin Dashboard (`http://localhost:5173`).
2.  Clicks **"Create New Job"** or manages existing ones from the dashboard.
3.  Enters the Job Title: `Senior Python Backend Developer`.
4.  Pastes the Job Description (e.g., _"Looking for an expert in Python, FastAPI, SQL, Docker, and AWS..."_).
5.  Sets the **Passing Threshold** to `65%`.
6.  The recruiter can also **Edit** the description later or **Delete** the job once filled.
7.  The system saves the job and generates a secure **Magic Link** (e.g., `http://localhost:5173/apply/8a7b6c5d...`).

### Step 1.5: Track History (Recruiter)

1.  Recruiter clicks **"View Registry"** to see a full history of all resumes processed, regardless of whether they passed or failed.
2.  Search through candidates by name, email, or position to find historical applicants.

### Step 2: Apply to the Job (Candidate)

1.  The recruiter emails the Magic Link to a candidate.
2.  The candidate clicks the link and lands on the **Consent Gate**, explaining that AI will process their data locally.
3.  After consenting, the candidate uploads their resume (PDF, DOCX, or TXT).

### Step 3: Instant AI Analysis (Backend)

1.  The backend's OCR parser extracts the text from the resume.
2.  The NLP Extractor scans for over 300+ known tech skills.
3.  The Matcher compares the extracted skills to the Job Description using a TF-IDF Cosine Similarity algorithm.
4.  _Result:_ The candidate scores **72%**.

### Step 4: Submission (Candidate & System)

1.  Because `72%` > `65%`, the candidate sees the **Pass Screen** celebrating their match!
2.  They are prompted to enter their Name and Email in the final application form.
3.  The application is saved to the database (SQLite or Neon PostgreSQL).
4.  _(If the candidate had scored 40%, they would have been gently rejected with a "Skill Gap" summary, saving the recruiter time)._

---

## 📝 License

This project is provided as-is for educational and professional use. Modify and distribute according to your needs. Released under Apache License 2.0
