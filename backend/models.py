from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from backend.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id          = Column(String, primary_key=True)
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    threshold   = Column(Integer, nullable=False, default=60)
    created_at  = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())


class ShareToken(Base):
    __tablename__ = "share_tokens"

    token      = Column(String, primary_key=True)
    job_id     = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    revoked    = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
    expires_at = Column(String, nullable=True)


class Resume(Base):
    __tablename__ = "resumes"

    id              = Column(String, primary_key=True)
    token           = Column(String, ForeignKey("share_tokens.token"), nullable=False)
    filename        = Column(String, nullable=True)
    file_path       = Column(String, nullable=True)
    raw_text        = Column(Text, nullable=True)
    structured_data = Column(Text, nullable=True)   # JSON
    uploaded_at     = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())


class MatchResult(Base):
    __tablename__ = "match_results"

    id             = Column(String, primary_key=True)
    job_id         = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id      = Column(String, ForeignKey("resumes.id"), nullable=False)
    score          = Column(Integer, nullable=False)
    matched_skills = Column(Text, nullable=True)    # JSON array
    missing_skills = Column(Text, nullable=True)    # JSON array
    summary        = Column(Text, nullable=True)
    passed         = Column(Integer, nullable=False, default=0)
    created_at     = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())


class Application(Base):
    __tablename__ = "applications"

    id           = Column(String, primary_key=True)
    match_id     = Column(String, ForeignKey("match_results.id", ondelete="CASCADE"), nullable=False)
    name         = Column(String, nullable=False)
    email        = Column(String, nullable=False)
    phone        = Column(String, nullable=True)
    linkedin     = Column(String, nullable=True)
    portfolio    = Column(String, nullable=True)
    cover_letter = Column(Text, nullable=True)
    submitted_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
