-- Migration: Add cover_letter to applications table
-- Target: Neon PostgreSQL / SQLite
-- Date: 2026-05-12

ALTER TABLE applications ADD COLUMN cover_letter TEXT;
