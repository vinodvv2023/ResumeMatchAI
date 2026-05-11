from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from backend.database import get_db
from backend.models import MatchResult, Application
from backend.schemas import ApplicationCreate, ApplicationOut

router = APIRouter(prefix="/applications", tags=["Applications"])

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
