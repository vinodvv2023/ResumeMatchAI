-- Initial Schema Migration for ResumeReader (PostgreSQL / Neon)
-- Generated on 2026-05-11

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    threshold INT NOT NULL DEFAULT 60,
    created_at VARCHAR(50) NOT NULL
);

-- Share Tokens table (Magic Links)
CREATE TABLE IF NOT EXISTS share_tokens (
    token VARCHAR(255) PRIMARY KEY,
    job_id VARCHAR(255) REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    revoked INT NOT NULL DEFAULT 0,
    created_at VARCHAR(50) NOT NULL,
    expires_at VARCHAR(50)
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) REFERENCES share_tokens(token) NOT NULL,
    filename VARCHAR(255),
    raw_text TEXT,
    structured_data TEXT, -- JSON content
    uploaded_at VARCHAR(50) NOT NULL
);

-- Match Results table
CREATE TABLE IF NOT EXISTS match_results (
    id VARCHAR(255) PRIMARY KEY,
    job_id VARCHAR(255) REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    resume_id VARCHAR(255) REFERENCES resumes(id) NOT NULL,
    score INT NOT NULL,
    matched_skills TEXT, -- JSON array
    missing_skills TEXT, -- JSON array
    summary TEXT,
    passed INT NOT NULL DEFAULT 0,
    created_at VARCHAR(50) NOT NULL
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(255) PRIMARY KEY,
    match_id VARCHAR(255) REFERENCES match_results(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    linkedin VARCHAR(255),
    portfolio VARCHAR(255),
    submitted_at VARCHAR(50) NOT NULL
);
