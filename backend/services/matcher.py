"""
Matcher Service (no LLM)
========================
Scores a candidate against a Job Description using TF-IDF and
cosine similarity on extracted skills.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.services.extractor import extract_skills_from_text


def calculate_match(job_description: str, resume_raw_text: str, resume_skills: list[str]) -> dict:
    """
    Returns a score from 0-100, and lists of matched/missing skills.
    """
    # 1. Extract required skills from Job Description
    required_skills = extract_skills_from_text(job_description)
    
    # 2. Find overlap
    candidate_skills_set = set(resume_skills)
    required_skills_set = set(required_skills)
    
    matched_skills = list(required_skills_set & candidate_skills_set)
    missing_skills = list(required_skills_set - candidate_skills_set)
    
    # 3. Calculate TF-IDF Cosine Similarity for overall text match
    # We compare the JD text with the full raw text of the resume
    documents = [job_description.lower(), resume_raw_text.lower()]
    
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(documents)
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        text_score = int(cosine_sim * 100)
    except Exception:
        # Fallback if text is too short or empty
        text_score = 0
        
    # 4. Calculate Skill Match Score
    if required_skills:
        skill_score = int((len(matched_skills) / len(required_skills)) * 100)
    else:
        skill_score = 100  # If no specific skills required, they didn't fail this part
        
    # 5. Blended Score: 60% Skills, 40% Text similarity
    final_score = int((skill_score * 0.6) + (text_score * 0.4))
    
    # Generate a simple summary
    summary = f"Candidate matches {len(matched_skills)} out of {len(required_skills)} required skills. Overall text relevance is {text_score}%."
    
    return {
        "score": final_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "summary": summary
    }
