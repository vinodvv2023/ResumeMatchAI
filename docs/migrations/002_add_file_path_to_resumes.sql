-- Migration: Add file_path to resumes table
-- Target: Neon PostgreSQL / SQLite
-- Date: 2026-05-12

ALTER TABLE resumes ADD COLUMN file_path TEXT;
