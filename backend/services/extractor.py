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
    extra_links   = blocks.get("links", [])
    contact = _parse_contact(contact_lines, raw, extra_links)

    return {
        "contact":   contact,
        "summary":   summary,
        "skills":    skills,
        "experience": experience,
        "education": education,
        "certifications": blocks.get("certifications", []),
        "projects":  blocks.get("projects", []),
    }


def redact_pii(text: str, contact: dict[str, str]) -> str:
    """
    Remove Name, Email, Phone, and URLs from text to protect privacy.
    """
    redacted = text
    
    # Redact Name (if found and long enough)
    name = contact.get("name")
    if name and len(name) > 3:
        # Use case-insensitive replacement
        pattern = re.compile(re.escape(name), re.IGNORECASE)
        redacted = pattern.sub("[CANDIDATE NAME]", redacted)
    
    # Redact Email
    email = contact.get("email")
    if email:
        pattern = re.compile(re.escape(email), re.IGNORECASE)
        redacted = pattern.sub("[EMAIL REDACTED]", redacted)
        
    # Redact Phone
    phone = contact.get("phone")
    if phone:
        pattern = re.compile(re.escape(phone), re.IGNORECASE)
        redacted = pattern.sub("[PHONE REDACTED]", redacted)
        
    # Redact Social/Portfolio URLs
    for key in ["linkedin", "portfolio", "github"]:
        url = contact.get(key)
        if url:
            # Try to match the whole URL or the specific handle
            pattern = re.compile(re.escape(url), re.IGNORECASE)
            redacted = pattern.sub(f"[{key.upper()} REDACTED]", redacted)
            
            # Also catch the handle if it's a social link
            if "/" in url:
                handle = url.split("/")[-1]
                if handle and len(handle) > 2:
                    pattern = re.compile(re.escape(handle), re.IGNORECASE)
                    redacted = pattern.sub(f"[{key.upper()} HANDLE REDACTED]", redacted)

    # General Regex for any remaining emails or links to be safe
    email_re = re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.IGNORECASE)
    url_re = re.compile(r"https?://[\w./\-?&=%]+", re.IGNORECASE)
    
    redacted = email_re.sub("[EMAIL REDACTED]", redacted)
    redacted = url_re.sub("[URL REDACTED]", redacted)
    
    return redacted


# ── Internal Helpers ──────────────────────────────────────────────────────────

def _parse_contact(lines: list[str], raw: str, extra_links: list[str] = None) -> dict[str, str]:
    email_re    = re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.IGNORECASE)
    phone_re    = re.compile(r"(\+?\d[\d\s\-().]{7,}\d)")
    linkedin_re = re.compile(r"linkedin\.com/in/([\w\-]+)", re.IGNORECASE)
    github_re   = re.compile(r"github\.com/([\w\-]+)", re.IGNORECASE)
    portfolio_re = re.compile(r"(portfolio|behance\.net|dribbble\.com|personal-website)[\w\-\./]*", re.IGNORECASE)

    blob = " ".join(lines) + "\n" + "\n".join(raw.splitlines()[:15])
    if extra_links:
        blob += " " + " ".join(extra_links)

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
    elif extra_links:
        # Check if any extra link is linkedin
        for link in extra_links:
            if "linkedin.com/in/" in link:
                contact["linkedin"] = link
                break

    m = github_re.search(blob)
    if m:
        contact["portfolio"] = f"github.com/{m.group(1)}"
    
    # Other portfolio/links
    if "portfolio" not in contact:
        m = portfolio_re.search(blob)
        if m:
            contact["portfolio"] = m.group(0)
        elif extra_links:
            for link in extra_links:
                if any(x in link for x in ["github", "gitlab", "behance", "dribbble", "portfolio"]):
                    contact["portfolio"] = link
                    break

    # Heuristic: Find Name (Strict)
    lines = raw.splitlines()
    potential_candidates = []
    
    email = contact.get("email")
    phone = contact.get("phone")

    # 1. Check lines containing Email/Phone (High Probability)
    for line in lines:
        if (email and email in line) or (phone and phone in line):
            # Clean the line of the email/phone to see what's left
            cleaned = line
            if email: cleaned = cleaned.replace(email, "")
            if phone: cleaned = cleaned.replace(phone, "")
            cleaned = cleaned.strip(" |,:;-_")
            if cleaned:
                potential_candidates.append((cleaned, 0.95)) # Higher priority

    # 2. Check top of document (Medium Probability)
    for line in lines[:7]:
        potential_candidates.append((line.strip(), 0.80))
        
    # 3. Check bottom of document (Low Probability)
    for line in lines[-5:]:
        potential_candidates.append((line.strip(), 0.60))

    final_name = None
    for cand, prob in potential_candidates:
        if not cand: continue
        
        # Strict validation: 2-3 words, All Capitalized, No numbers
        words = cand.split()
        if 2 <= len(words) <= 3:
            # Must be purely alphabetic and properly capitalized (e.g. John Doe)
            if all(w[0].isupper() and w.isalpha() for w in words if len(w) > 1):
                # Avoid common resume noise
                noise = ["CURRICULUM", "VITAE", "RESUME", "PAGE", "SUMMARY", "EXPERIENCE", "PHONE", "EMAIL", "LINKEDIN"]
                if not any(n in cand.upper() for n in noise):
                    # Only pre-fill if probability is high (>= 0.80 as per user requirement of 90% logic)
                    if prob >= 0.80:
                        final_name = cand
                        break

    # We no longer pre-fill the name field as per user request
    # contact["name"] = final_name 
    
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
