import json
import logging
from openai import OpenAI
from backend.config import DEEPINFRA_API_TOKEN, AGENT_DEEPINFRA_MODEL

logger = logging.getLogger(__name__)

# Initialize OpenAI client for DeepInfra
client = None
if DEEPINFRA_API_TOKEN:
    client = OpenAI(
        api_key=DEEPINFRA_API_TOKEN,
        base_url="https://api.deepinfra.com/v1/openai",
    )

def get_llm_analysis(jd_text: str, resume_text: str) -> dict:
    """
    Uses LLM to analyze the match between JD and Resume.
    Returns a dict with score, matched_skills, missing_skills, and summary.
    """
    if not client:
        logger.warning("LLM client not initialized. Missing DEEPINFRA_API_TOKEN.")
        return None

    prompt = f"""
    You are an expert HR Recruiter. Analyze the match between the following Job Description and Resume.
    
    JOB DESCRIPTION:
    {jd_text}
    
    RESUME:
    {resume_text}
    
    Return your analysis strictly in JSON format with the following keys:
    - score: Integer from 0 to 100 representing the match quality.
    - matched_skills: List of strings of skills from the JD found in the resume.
    - missing_skills: List of strings of key skills from the JD missing in the resume.
    - summary: A 2-sentence professional summary of the fit.
    
    JSON only, no other text.
    """

    print("\n" + "="*50)
    print("AI ANALYSIS REQUEST")
    print(f"Model: {AGENT_DEEPINFRA_MODEL}")
    print("-" * 50)
    print(f"JOB DESCRIPTION (truncated):\n{jd_text[:500]}...")
    print("-" * 50)
    print(f"RESUME TEXT (truncated):\n{resume_text[:500]}...")
    print("-" * 50)
    print(f"FULL PROMPT SENT TO LLM:\n{prompt}")
    print("="*50 + "\n")

    try:
        response = client.chat.completions.create(
            model=AGENT_DEEPINFRA_MODEL,
            messages=[
                {"role": "system", "content": "You are a recruitment assistant that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        
        result_text = response.choices[0].message.content
        return json.loads(result_text)
    except Exception as e:
        logger.error(f"LLM Analysis failed: {str(e)}")
        return None

if __name__ == "__main__":
    # Test script
    test_jd = "Looking for a Python developer with FastAPI and React experience."
    test_resume = "I am a Java developer with Spring Boot experience."
    print(get_llm_analysis(test_jd, test_resume))
