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


def calculate_match(job_description: str, resume_raw_text: str, resume_skills: list[str], contact_info: dict[str, str] = None) -> dict:
    """
    Returns a score from 0-100, and lists of matched/missing skills.
    First tries LLM, then falls back to TF-IDF logic.
    """
    
    # 1. Try LLM Analysis first
    # Redact PII to protect privacy before sending to LLM
    redacted_resume = resume_raw_text
    if contact_info:
        redacted_resume = redact_pii(resume_raw_text, contact_info)
    
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
    
    # Extract required skills from Job Description
    required_skills = extract_skills_from_text(job_description)
    
    # Find overlap
    candidate_skills_set = set(resume_skills)
    required_skills_set = set(required_skills)
    
    matched_skills = list(required_skills_set & candidate_skills_set)
    missing_skills = list(required_skills_set - candidate_skills_set)
    
    # Calculate TF-IDF Cosine Similarity for overall text match
    documents = [job_description.lower(), resume_raw_text.lower()]
    
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
