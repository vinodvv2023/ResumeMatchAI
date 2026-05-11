from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# ── Jobs ────────────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title:       str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=20)
    threshold:   int = Field(default=60, ge=0, le=100)


class JobOut(BaseModel):
    id:          str
    title:       str
    description: str
    threshold:   int
    created_at:  str
    magic_link:  Optional[str] = None
    token:       Optional[str] = None
    latest_score: Optional[int] = None

    model_config = {"from_attributes": True}


# ── Apply / Token validation ─────────────────────────────────────────────────

class TokenInfo(BaseModel):
    """Returned when candidate opens magic link — minimal info only."""
    job_title:   str
    job_id:      str
    valid:       bool
    expired:     bool = False
    revoked:     bool = False


# ── Match Result ─────────────────────────────────────────────────────────────

class MatchOut(BaseModel):
    match_id:       str
    score:          int
    passed:         bool
    matched_skills: List[str]
    missing_skills: List[str]
    summary:        str


# ── Candidate Application Form ───────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    match_id:  str
    name:      str  = Field(..., min_length=2, max_length=100)
    email:     str  = Field(..., min_length=5)
    phone:     Optional[str] = None
    linkedin:  Optional[str] = None
    portfolio: Optional[str] = None


class ApplicationOut(BaseModel):
    id:           str
    match_id:     str
    name:         str
    email:        str
    phone:        Optional[str]
    linkedin:     Optional[str]
    portfolio:    Optional[str]
    submitted_at: str

    model_config = {"from_attributes": True}


# ── Admin Stats ──────────────────────────────────────────────────────────────

class StatsOut(BaseModel):
    total_jobs:     int
    active_tokens:  int
    total_resumes:  int
    total_matches:  int
    total_passes:   int
    total_fails:    int
    pass_rate:      Optional[float]
    avg_score:      Optional[float]
    total_applications: int
