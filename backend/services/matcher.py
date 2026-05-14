"""
Matcher Service (no LLM)
========================
Scores a candidate against a Job Description using TF-IDF and
cosine similarity on extracted skills.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.services.extractor import extract_skills_from_text, redact_pii
from backend.services.llm import get_llm_analysis


def calculate_match(job_description: str, sections: dict, contact_info: dict[str, str] = None) -> dict:
    """
    Returns a score from 0-100, and lists of matched/missing skills.
    First tries LLM, then falls back to TF-IDF logic.
    
    Skips the 'contact' and 'other' (header) sections to protect privacy.
    """
    
    # 1. Prepare Content (Skip Header)
    # We only send relevant sections to the LLM
    content_parts = []
    relevant_sections = ["summary", "skills", "experience", "education", "certifications", "projects", "languages"]
    
    def purge_header_noise(lines):
        """Strip lines that look like headers/contact info from the start of a section."""
        cleaned = []
        skip_mode = True
        # Expanded markers to catch redacted info and typical header terms
        noise_markers = [
            "MOBILE", "EMAIL", "LINKEDIN", "GITHUB", "PORTFOLIO", "PHONE", "WEBSITE", "ADDRESS",
            "[PHONE", "[EMAIL", "[LINKEDIN", "[GITHUB", "REDACTED", "|"
        ]
        
        for i, line in enumerate(lines):
            # If we've already found 10 lines, stop skipping (failsafe)
            if i > 10: skip_mode = False
            
            upper_line = line.upper().strip()
            if not upper_line: continue
            
            # Check for name/title block (usually 2-3 capitalized words, often with separators)
            is_title_block = (len(line.split()) < 10 and any(m in upper_line for m in ["|", "-", "•"]))
            is_noise = any(m in upper_line for m in noise_markers) or is_title_block
            
            if skip_mode and is_noise:
                continue
            else:
                skip_mode = False # Found the real start
                cleaned.append(line)
        return cleaned

    for sec in relevant_sections:
        lines = sections.get(sec, [])
        if lines:
            # Purge the header noise from the first section we find (usually Summary)
            if not content_parts:
                lines = purge_header_noise(lines)
            
            if lines:
                content_parts.append(f"### {sec.upper()}\n" + "\n".join(lines))
            
    filtered_resume = "\n\n".join(content_parts)
    
    # Fallback to raw text if no sections were detected (rare)
    if not filtered_resume:
        filtered_resume = sections.get("raw_text", "")

    # 2. Try LLM Analysis
    # Redact PII (just in case personal info appears in main sections)
    redacted_resume = filtered_resume
    if contact_info:
        redacted_resume = redact_pii(filtered_resume, contact_info)
    
    llm_result = get_llm_analysis(job_description, redacted_resume)
    if llm_result:
        return {
            "score": llm_result.get("score", 0),
            "matched_skills": llm_result.get("matched_skills", []),
            "missing_skills": llm_result.get("missing_skills", []),
            "summary": llm_result.get("summary", "Analysis completed by AI.")
        }

    # 2. Fallback to existing Logic (no LLM)
    # -------------------------------------
    
    # Extract skills from resume text and job description
    resume_skills = extract_skills_from_text(filtered_resume)
    required_skills = extract_skills_from_text(job_description)
    
    # Find overlap
    candidate_skills_set = set(resume_skills)
    required_skills_set = set(required_skills)
    
    matched_skills = list(required_skills_set & candidate_skills_set)
    missing_skills = list(required_skills_set - candidate_skills_set)
    
    # Calculate TF-IDF Cosine Similarity for overall text match
    documents = [job_description.lower(), filtered_resume.lower()]
    
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(documents)
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        text_score = int(cosine_sim * 100)
    except Exception:
        text_score = 0
        
    # Calculate Skill Match Score
    if required_skills:
        skill_score = int((len(matched_skills) / len(required_skills)) * 100)
    else:
        # If no skills found in JD, we rely 100% on text similarity but cap it
        # This fixes the "61% Great Match" issue when JD is empty
        skill_score = text_score 
        
    # Blended Score: 60% Skills, 40% Text similarity
    final_score = int((skill_score * 0.6) + (text_score * 0.4))
    
    # Generate a simple summary
    summary = f"Candidate matches {len(matched_skills)} out of {len(required_skills)} required skills. Overall text relevance is {text_score}%."
    
    return {
        "score": final_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "summary": summary
    }
