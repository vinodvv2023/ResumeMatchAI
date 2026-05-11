from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from backend.database import get_db
from backend.models import MatchResult, Application, Job, Resume
from backend.schemas import ApplicationCreate, ApplicationOut, RegistryEntry
from typing import List
import json

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("/registry", response_model=List[RegistryEntry])
def get_registry(db: Session = Depends(get_db)):
    """Get a full registry of all processed resumes and scores."""
    query = db.query(MatchResult, Job.title, Application, Resume.structured_data)\
        .join(Job, MatchResult.job_id == Job.id)\
        .join(Resume, MatchResult.resume_id == Resume.id)\
        .outerjoin(Application, MatchResult.id == Application.match_id)\
        .order_by(MatchResult.created_at.desc())\
        .all()
    
    registry = []
    for match, job_title, app, structured_data in query:
        candidate_name = "Unknown"
        email = None
        
        if app:
            candidate_name = app.name
            email = app.email
        elif structured_data:
            try:
                data = json.loads(structured_data)
                candidate_name = data.get("name", "Unknown")
                email = data.get("email")
            except:
                pass
                
        registry.append(RegistryEntry(
            id=match.id,
            job_title=job_title,
            candidate_name=candidate_name,
            email=email,
            score=match.score,
            passed=bool(match.passed),
            created_at=match.created_at,
            match_id=match.id,
            has_applied=app is not None
        ))
        
    return registry


@router.post("", response_model=ApplicationOut)
def submit_application(app_in: ApplicationCreate, db: Session = Depends(get_db)):
    """Submit application form (only allowed if match passed)."""
    # 1. Verify match result exists and passed
    match = db.query(MatchResult).filter(MatchResult.id == app_in.match_id).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match result not found")
        
    if not match.passed:
        raise HTTPException(status_code=403, detail="Cannot submit application for failed match")
        
    # 2. Check if already applied
    existing = db.query(Application).filter(Application.match_id == app_in.match_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Application already submitted for this match")
        
    # 3. Create application
    app_id = str(uuid.uuid4()).replace("-", "")
    db_app = Application(
        id=app_id,
        match_id=app_in.match_id,
        name=app_in.name,
        email=app_in.email,
        phone=app_in.phone,
        linkedin=app_in.linkedin,
        portfolio=app_in.portfolio
    )
    
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    
    return db_app
