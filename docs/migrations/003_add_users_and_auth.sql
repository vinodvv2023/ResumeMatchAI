-- Migration: Add user authentication and user-scoped jobs
-- Date: 2026-05-16
-- Run order: After 002_add_file_path_to_resumes.sql

BEGIN;

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id              VARCHAR(255) PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    created_at      VARCHAR(50) NOT NULL
);

-- 2. Add user_id column to jobs (nullable first for existing data)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Create index on jobs.user_id for query performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);

-- 4. Create index on users.email for login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 5. Backfill: create a system user for all existing jobs so FK constraint is satisfied
--    Change the email/password as needed — this is a one-time migration helper.
--    The password hash below is bcrypt for "changeme123".
INSERT INTO users (id, email, hashed_password, created_at)
VALUES (
    'system0000000000000000000000000',
    'system@resumematch.local',
    '$2b$12$LJ3m9bMk9JGYvBCuOwWPJeqGh3T5RG1qXKHnPqKKfNSJuHOFyGNXm',
    '2026-05-16T00:00:00'
)
ON CONFLICT (id) DO NOTHING;

UPDATE jobs
SET user_id = 'system0000000000000000000000000'
WHERE user_id IS NULL;

-- 6. Make user_id NOT NULL after backfill
ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;

COMMIT;
