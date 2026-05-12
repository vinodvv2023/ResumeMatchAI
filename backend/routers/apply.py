from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import uuid
import json
import os

from backend.database import get_db
from backend.models import ShareToken, Job, Resume, MatchResult
from backend.schemas import TokenInfo, MatchOut
from backend.services.magic_link import is_expired
from backend.services.ocr_parser import parse_file
from backend.services.extractor import extract_structured
from backend.services.matcher import calculate_match

router = APIRouter(prefix="/apply", tags=["Apply"])

@router.get("/{token}", response_model=TokenInfo)
def validate_token(token: str, db: Session = Depends(get_db)):
    """Validate a magic link token and return basic job info."""
    db_token = db.query(ShareToken).filter(ShareToken.token == token).first()
    
    if not db_token:
        raise HTTPException(status_code=404, detail="Token not found")
        
    job = db.query(Job).filter(Job.id == db_token.job_id).first()
    
    is_valid = True
    expired = is_expired(db_token.expires_at)
    
    if db_token.revoked or expired or not job:
        is_valid = False
        
    return TokenInfo(
        job_title=job.title if job else "Unknown Job",
        job_description=job.description if job else "",
        job_id=job.id if job else "",
        valid=is_valid,
        expired=expired,
        revoked=bool(db_token.revoked)
    )

@router.post("/{token}/upload", response_model=MatchOut)
async def upload_resume(token: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Process uploaded resume, run extraction and matching."""
    # 1. Validate Token
    db_token = db.query(ShareToken).filter(ShareToken.token == token).first()
    if not db_token or db_token.revoked or is_expired(db_token.expires_at):
        raise HTTPException(status_code=403, detail="Invalid or expired magic link")
        
    job = db.query(Job).filter(Job.id == db_token.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # 2. Save File to Disk
    import shutil
    upload_dir = "backend/uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)
    
    resume_id = str(uuid.uuid4()).replace("-", "")
    file_path = f"{upload_dir}/{resume_id}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        file.file.seek(0)
        shutil.copyfileobj(file.file, buffer)

    # 3. Parse and Extract
    try:
        file.file.seek(0)
        file_bytes = await file.read()
        blocks = parse_file(file_bytes, file.filename or "unknown.pdf")
        structured_data = extract_structured(blocks)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
        
    # 4. Save Resume to DB
    db_resume = Resume(
        id=resume_id,
        token=token,
        filename=file.filename,
        file_path=file_path,
        raw_text=blocks.get("raw_text", ""),
        structured_data=json.dumps(structured_data)
    )
    db.add(db_resume)
    db.flush() # Ensure resume exists in DB before linking match_result
    
    # 5. Calculate Match Score
    match_result = calculate_match(
        job_description=job.description,
        sections=blocks,
        contact_info=structured_data.get("contact", {})
    )
    
    passed = match_result["score"] >= job.threshold
    
    # 6. Save Match Result to DB
    match_id = str(uuid.uuid4()).replace("-", "")
    db_match = MatchResult(
        id=match_id,
        job_id=job.id,
        resume_id=resume_id,
        score=match_result["score"],
        matched_skills=json.dumps(match_result["matched_skills"]),
        missing_skills=json.dumps(match_result["missing_skills"]),
        summary=match_result["summary"],
        passed=int(passed)
    )
    db.add(db_match)
    
    db.commit()
    
    return MatchOut(
        match_id=match_id,
        score=match_result["score"],
        passed=passed,
        matched_skills=match_result["matched_skills"],
        missing_skills=match_result["missing_skills"],
        summary=match_result["summary"],
        extracted_data=structured_data.get("contact", {})
    )
