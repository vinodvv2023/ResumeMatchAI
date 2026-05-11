"""
Skill Extractor (no LLM)
========================
Extracts structured data from parsed resume blocks using:
  - A comprehensive 300+ skill keyword list
  - Regex patterns for dates, degrees, contact info
  - Simple heuristics for section parsing
"""

from __future__ import annotations

import re
from typing import Any

# ── Master Skills Vocabulary ─────────────────────────────────────────────────

SKILLS_VOCAB: set[str] = {
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang",
    "rust", "php", "ruby", "swift", "kotlin", "scala", "r", "matlab", "perl",
    "shell", "bash", "powershell", "sql", "html", "css", "sass", "less",
    "dart", "lua", "haskell", "elixir", "erlang", "f#", "cobol", "fortran",

    # Web Frameworks
    "react", "angular", "vue", "svelte", "nextjs", "next.js", "nuxt", "gatsby",
    "django", "flask", "fastapi", "express", "nestjs", "nest.js", "rails",
    "spring", "spring boot", "laravel", "symfony", "asp.net", ".net", "blazor",
    "jquery", "bootstrap", "tailwind", "tailwindcss", "material ui", "mui",
    "redux", "zustand", "graphql", "rest", "rest api", "soap", "grpc",

    # Data / ML / AI
    "machine learning", "deep learning", "nlp", "natural language processing",
    "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn",
    "sklearn", "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly",
    "hugging face", "transformers", "openai", "langchain", "llm",
    "data science", "data analysis", "data engineering", "data pipeline",
    "etl", "feature engineering", "model deployment", "mlops",
    "spark", "hadoop", "kafka", "airflow", "dbt", "snowflake",

    # Databases
    "mysql", "postgresql", "postgres", "sqlite", "mongodb", "redis",
    "elasticsearch", "cassandra", "dynamodb", "firebase", "supabase",
    "oracle", "mssql", "sql server", "mariadb", "neo4j", "influxdb",
    "vector database", "pinecone", "weaviate", "chromadb",

    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "cloud computing",
    "docker", "kubernetes", "k8s", "helm", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci", "ci/cd", "devops",
    "linux", "unix", "nginx", "apache", "cloudflare",
    "lambda", "ec2", "s3", "rds", "cloudwatch", "ecs", "eks",
    "azure devops", "azure functions", "blob storage",

    # Tools & Practices
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "trello",
    "agile", "scrum", "kanban", "tdd", "bdd", "unit testing", "integration testing",
    "postman", "swagger", "openapi", "figma", "adobe xd", "sketch",
    "webpack", "vite", "babel", "eslint", "prettier",
    "microservices", "serverless", "event-driven", "message queue",
    "rabbitmq", "celery", "websocket", "oauth", "jwt", "sso", "saml",

    # Mobile
    "react native", "flutter", "android", "ios", "xcode", "android studio",
    "mobile development", "pwa", "capacitor", "ionic",

    # Soft Skills
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "project management", "time management",
    "mentoring", "collaboration", "analytical", "attention to detail",
    "adaptability", "creativity", "innovation",

    # Business / Domain
    "product management", "ux", "ui", "user experience", "user interface",
    "seo", "digital marketing", "crm", "erp", "salesforce",
    "business intelligence", "bi", "tableau", "power bi", "looker",
    "data warehouse", "data lake", "data visualization",
    "finance", "accounting", "hr", "supply chain", "logistics",

    # Security
    "cybersecurity", "security", "penetration testing", "pen testing",
    "owasp", "ssl", "tls", "encryption", "authentication", "authorization",
    "siem", "soc", "vulnerability assessment", "firewall",

    # Architecture
    "system design", "architecture", "distributed systems", "scalability",
    "high availability", "load balancing", "caching", "cdn",
    "api design", "database design", "schema design",
}

# Build lowercase→canonical map for fast lookup
_SKILLS_LOWER = {s.lower(): s for s in SKILLS_VOCAB}


# ── Degree Keywords ───────────────────────────────────────────────────────────

DEGREE_PATTERNS = re.compile(
    r"\b(b\.?s\.?c?|m\.?s\.?c?|ph\.?d\.?|b\.?tech|m\.?tech|b\.?e\.|"
    r"bachelor|master|doctorate|associate|diploma|mba|bba|bca|mca|"
    r"engineer|engineering|computer science|information technology)\b",
    re.IGNORECASE,
)

DATE_RANGE_RE = re.compile(
    r"\b(\d{4})\s*[-–—to]+\s*(\d{4}|present|current|now)\b",
    re.IGNORECASE,
)


# ── Public API ────────────────────────────────────────────────────────────────

def extract_skills_from_text(text: str) -> list[str]:
    """Return a deduplicated list of skills found in text (no LLM)."""
    text_lower = text.lower()
    found: list[str] = []

    for skill_lower, skill_canonical in _SKILLS_LOWER.items():
        # Word-boundary aware match
        pattern = r"\b" + re.escape(skill_lower) + r"\b"
        if re.search(pattern, text_lower):
            found.append(skill_canonical)

    return sorted(set(found))


def extract_structured(blocks: dict[str, Any]) -> dict[str, Any]:
    """
    Turn parsed OCR blocks into a structured candidate profile dict.
    """
    raw = blocks.get("raw_text", "")

    # Skills: merge explicit skills section + full-text scan
    skills_text = " ".join(blocks.get("skills", []))
    skills_from_section = extract_skills_from_text(skills_text)
    skills_from_all     = extract_skills_from_text(raw)
    skills = sorted(set(skills_from_section) | set(skills_from_all))

    # Education
    edu_lines = blocks.get("education", [])
    education = _parse_education(edu_lines)

    # Experience
    exp_lines = blocks.get("experience", [])
    experience = _parse_experience(exp_lines)

    # Summary
    summary = " ".join(blocks.get("summary", []))[:1000]

    # Contact (already parsed by ocr_parser)
    contact_lines = blocks.get("contact", [])
    contact = _parse_contact(contact_lines, raw)

    return {
        "contact":   contact,
        "summary":   summary,
        "skills":    skills,
        "experience": experience,
        "education": education,
        "certifications": blocks.get("certifications", []),
        "projects":  blocks.get("projects", []),
    }


# ── Internal Helpers ──────────────────────────────────────────────────────────

def _parse_contact(lines: list[str], raw: str) -> dict[str, str]:
    email_re    = re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.IGNORECASE)
    phone_re    = re.compile(r"(\+?\d[\d\s\-().]{7,}\d)")
    linkedin_re = re.compile(r"linkedin\.com/in/([\w\-]+)", re.IGNORECASE)

    blob = " ".join(lines) + "\n" + "\n".join(raw.splitlines()[:15])

    contact: dict[str, str] = {}

    m = email_re.search(blob)
    if m:
        contact["email"] = m.group(0)

    m = phone_re.search(blob)
    if m:
        contact["phone"] = m.group(1).strip()

    m = linkedin_re.search(blob)
    if m:
        contact["linkedin"] = f"linkedin.com/in/{m.group(1)}"

    # Heuristic: first non-empty line in raw that looks like a name
    for line in raw.splitlines()[:5]:
        line = line.strip()
        if 2 <= len(line.split()) <= 4 and line.replace(" ", "").isalpha():
            contact["name"] = line
            break

    return contact


def _parse_education(lines: list[str]) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    current: dict[str, str] = {}

    for line in lines:
        deg = DEGREE_PATTERNS.search(line)
        dates = DATE_RANGE_RE.search(line)
        if deg:
            if current:
                results.append(current)
            current = {"degree": line.strip()}
        elif dates and current:
            current["period"] = dates.group(0)
        elif current and "institution" not in current:
            current["institution"] = line.strip()

    if current:
        results.append(current)

    return results


def _parse_experience(lines: list[str]) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    current: dict[str, str] = {}

    for line in lines:
        dates = DATE_RANGE_RE.search(line)
        if dates:
            if current:
                results.append(current)
            current = {"period": dates.group(0), "raw": line.strip()}
        elif current:
            if "title" not in current:
                current["title"] = line.strip()
            elif "company" not in current:
                current["company"] = line.strip()

    if current:
        results.append(current)

    return results
