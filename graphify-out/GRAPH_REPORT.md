# Graph Report - C:\Users\xtrem\Downloads\python_proj\ResumeReader  (2026-05-11)

## Corpus Check
- 26 files · ~18,655 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 96 nodes · 139 edges · 20 communities detected
- Extraction: 71% EXTRACTED · 29% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `upload_resume()` - 9 edges
2. `_build_blocks()` - 9 edges
3. `Base` - 7 edges
4. `MatchResult` - 7 edges
5. `Validate a magic link token and return basic job info.` - 7 edges
6. `Process uploaded resume, run extraction and matching.` - 7 edges
7. `create_job()` - 7 edges
8. `extract_structured()` - 7 edges
9. `parse_file()` - 7 edges
10. `Job` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Job` --calls--> `create_job()`  [INFERRED]
  C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\models.py → C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\routers\jobs.py
- `ShareToken` --calls--> `create_job()`  [INFERRED]
  C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\models.py → C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\routers\jobs.py
- `MatchResult` --uses--> `Submit application form (only allowed if match passed).`  [INFERRED]
  C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\models.py → C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\routers\applications.py
- `Application` --uses--> `Submit application form (only allowed if match passed).`  [INFERRED]
  C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\models.py → C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\routers\applications.py
- `Application` --calls--> `submit_application()`  [INFERRED]
  C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\models.py → C:\Users\xtrem\Downloads\python_proj\ResumeReader\backend\routers\applications.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (15): Validate a magic link token and return basic job info., Process uploaded resume, run extraction and matching., upload_resume(), validate_token(), Base, Base, DeclarativeBase, is_expired() (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (16): _build_blocks(), _detect_section(), _empty_blocks(), _extract_contact(), _parse_docx(), parse_file(), _parse_pdf(), _parse_rtf() (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (11): extract_skills_from_text(), extract_structured(), _parse_contact(), _parse_education(), _parse_experience(), Skill Extractor (no LLM) ======================== Extracts structured data from, Return a deduplicated list of skills found in text (no LLM)., Turn parsed OCR blocks into a structured candidate profile dict. (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.26
Nodes (10): Submit application form (only allowed if match passed)., submit_application(), BaseModel, ApplicationCreate, ApplicationOut, JobCreate, JobOut, Returned when candidate opens magic link — minimal info only. (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (9): create_job(), get_job(), list_jobs(), generate_magic_link(), generate_token(), get_expiry(), Build the full candidate-facing URL for a token., Return ISO timestamp TOKEN_EXPIRY_DAYS from now. (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.5
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **16 isolated node(s):** `Returned when candidate opens magic link — minimal info only.`, `Skill Extractor (no LLM) ======================== Extracts structured data from`, `Return a deduplicated list of skills found in text (no LLM).`, `Turn parsed OCR blocks into a structured candidate profile dict.`, `Generate a cryptographically random UUID4 token.` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (2 nodes): `main.py`, `health_check()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `CreateJob.tsx`, `handleSubmit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `config.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `upload_resume()` connect `Community 0` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.345) - this node is a cross-community bridge._
- **Why does `parse_file()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `extract_structured()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `upload_resume()` (e.g. with `is_expired()` and `parse_file()`) actually correct?**
  _`upload_resume()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Base` (e.g. with `Job` and `ShareToken`) actually correct?**
  _`Base` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `MatchResult` (e.g. with `Base` and `Submit application form (only allowed if match passed).`) actually correct?**
  _`MatchResult` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Returned when candidate opens magic link — minimal info only.`, `Skill Extractor (no LLM) ======================== Extracts structured data from`, `Return a deduplicated list of skills found in text (no LLM).` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._