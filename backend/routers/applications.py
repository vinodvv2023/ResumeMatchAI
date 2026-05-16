from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import uuid
import json
import os

from backend.database import get_db
from backend.models import MatchResult, Application, Job, Resume, ShareToken, User
from backend.schemas import ApplicationCreate, ApplicationOut, RegistryEntry, BulkDelete
from backend.services.magic_link import generate_magic_link
from backend.routers.auth import get_current_user
from typing import List

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("/registry", response_model=List[RegistryEntry])
def get_registry(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(
        MatchResult, Job.title, Application, Resume.structured_data,
        Resume.raw_text, Resume.filename, ShareToken.token
    ).join(Job, MatchResult.job_id == Job.id)\
     .join(Resume, MatchResult.resume_id == Resume.id)\
     .join(ShareToken, Resume.token == ShareToken.token)\
     .outerjoin(Application, MatchResult.id == Application.match_id)\
     .filter(Job.user_id == current_user.id)\
     .order_by(MatchResult.created_at.desc())\
     .all()
    
    registry = []
    for match, job_title, app, structured_data, raw_text, filename, share_token in query:
        candidate_name = "Unknown"
        email = None
        
        if app:
            candidate_name = app.name
            email = app.email
        elif structured_data:
            try:
                data = json.loads(structured_data)
                contact = data.get("contact", {}) if isinstance(data.get("contact"), {}) else {}
                candidate_name = contact.get("name") or data.get("name", "Unknown")
                email = contact.get("email") or data.get("email")
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
            has_applied=app is not None,
            resume_text=raw_text,
            cover_letter=app.cover_letter if app else None,
            resume_id=match.resume_id,
            filename=filename,
            magic_link=generate_magic_link(share_token) if share_token else None,
        ))
        
    return registry


@router.post("", response_model=ApplicationOut)
def submit_application(app_in: ApplicationCreate, db: Session = Depends(get_db)):
    match = db.query(MatchResult).filter(MatchResult.id == app_in.match_id).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match result not found")
        
    if not match.passed:
        raise HTTPException(status_code=403, detail="Cannot submit application for failed match")
        
    existing = db.query(Application).filter(Application.match_id == app_in.match_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Application already submitted for this match")
        
    app_id = str(uuid.uuid4()).replace("-", "")
    db_app = Application(
        id=app_id,
        match_id=app_in.match_id,
        name=app_in.name,
        email=app_in.email,
        phone=app_in.phone,
        linkedin=app_in.linkedin,
        portfolio=app_in.portfolio,
        cover_letter=app_in.cover_letter
    )
    
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    
    return db_app


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(match_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    match = db.query(MatchResult).filter(MatchResult.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match result not found")
    
    job = db.query(Job).filter(Job.id == match.job_id).first()
    if not job or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Match result not found")
    
    resume = db.query(Resume).filter(Resume.id == match.resume_id).first()
    if resume and resume.file_path and os.path.exists(resume.file_path):
        os.remove(resume.file_path)
    if resume:
        db.delete(resume)
    db.delete(match)
    db.commit()
    return None


@router.post("/bulk-delete", status_code=status.HTTP_204_NO_CONTENT)
def bulk_delete_applications(data: BulkDelete, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_job_ids = [j.id for j in db.query(Job.id).filter(Job.user_id == current_user.id).all()]
    matches = db.query(MatchResult).filter(
        MatchResult.id.in_(data.ids),
        MatchResult.job_id.in_(user_job_ids),
    ).all()
    for match in matches:
        resume = db.query(Resume).filter(Resume.id == match.resume_id).first()
        if resume and resume.file_path and os.path.exists(resume.file_path):
            os.remove(resume.file_path)
        if resume:
            db.delete(resume)
        db.delete(match)
    db.commit()
    return None


@router.get("/resume/{resume_id}/file")
def get_resume_file(resume_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume or not resume.file_path:
        raise HTTPException(status_code=404, detail="Resume file not found")
    
    match = db.query(MatchResult).filter(MatchResult.resume_id == resume.id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Resume file not found")
    job = db.query(Job).filter(Job.id == match.job_id).first()
    if not job or job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="File missing on server")
        
    media_type = "application/octet-stream"
    if resume.filename:
        ext = resume.filename.lower()
        if ext.endswith(".pdf"): media_type = "application/pdf"
        elif ext.endswith(".docx"): media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif ext.endswith(".rtf"): media_type = "application/rtf"
        elif ext.endswith(".txt"): media_type = "text/plain"

    return FileResponse(
        resume.file_path, 
        media_type=media_type,
        filename=resume.filename
    )
