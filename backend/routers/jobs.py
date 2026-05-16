from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import datetime

from backend.database import get_db
from backend.models import Job, ShareToken, MatchResult, Application, Resume, User
from backend.schemas import JobCreate, JobOut, JobUpdate
from backend.services.magic_link import generate_token, generate_magic_link, get_expiry
from backend.config import PASS_THRESHOLD
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("", response_model=JobOut)
def create_job(job_in: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job_id = str(uuid.uuid4()).replace("-", "")
    
    db_job = Job(
        id=job_id,
        user_id=current_user.id,
        title=job_in.title,
        description=job_in.description,
        threshold=job_in.threshold
    )
    db.add(db_job)
    
    token_str = generate_token()
    db_token = ShareToken(
        token=token_str,
        job_id=job_id,
        expires_at=get_expiry()
    )
    db.add(db_token)
    
    db.commit()
    db.refresh(db_job)
    
    return JobOut(
        id=db_job.id,
        title=db_job.title,
        description=db_job.description,
        threshold=db_job.threshold,
        created_at=db_job.created_at,
        token=token_str,
        magic_link=generate_magic_link(token_str),
        latest_score=None
    )

@router.get("", response_model=List[JobOut])
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).order_by(Job.created_at.desc()).all()
    results = []
    
    for job in jobs:
        token_obj = db.query(ShareToken).filter(
            ShareToken.job_id == job.id, 
            ShareToken.revoked == 0
        ).order_by(ShareToken.created_at.desc()).first()
        
        latest_match = db.query(MatchResult).filter(
            MatchResult.job_id == job.id
        ).order_by(MatchResult.created_at.desc()).first()
        
        out = JobOut.model_validate(job)
        if token_obj:
            out.token = token_obj.token
            out.magic_link = generate_magic_link(token_obj.token)
        if latest_match:
            out.latest_score = latest_match.score
            
        results.append(out)
        
    return results

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    token_obj = db.query(ShareToken).filter(
        ShareToken.job_id == job.id, 
        ShareToken.revoked == 0
    ).order_by(ShareToken.created_at.desc()).first()
    
    out = JobOut.model_validate(job)
    if token_obj:
        out.token = token_obj.token
        out.magic_link = generate_magic_link(token_obj.token)
        
    return out


@router.put("/{job_id}", response_model=JobOut)
def update_job(job_id: str, job_in: JobUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    update_data = job_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_job, key, value)
        
    db.commit()
    db.refresh(db_job)
    
    return get_job(job_id, db, current_user)

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")

    match_result_ids = [mr.id for mr in db.query(MatchResult).filter(MatchResult.job_id == job_id).all()]
    if match_result_ids:
        db.query(Application).filter(Application.match_id.in_(match_result_ids)).delete(synchronize_session=False)
        db.query(MatchResult).filter(MatchResult.job_id == job_id).delete(synchronize_session=False)
        db.query(Resume).filter(Resume.token.in_(
            [st.token for st in db.query(ShareToken).filter(ShareToken.job_id == job_id).all()]
        )).delete(synchronize_session=False)
        db.query(ShareToken).filter(ShareToken.job_id == job_id).delete(synchronize_session=False)

    db.delete(db_job)
    db.commit()
    return None
