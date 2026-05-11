# Database Migrations

This directory contains SQL migration scripts for the ResumeReader platform.

## Usage with Neon (PostgreSQL)

To initialize your Neon database:

1.  Open the **Neon Console**.
2.  Navigate to the **SQL Editor**.
3.  Copy and paste the contents of `001_initial_schema.sql` into the editor.
4.  Run the query to create all necessary tables and foreign key constraints.

## Local Development (SQLite)

The FastAPI backend is configured to automatically create tables in SQLite if they don't exist. These migration files are primarily for production deployment on platforms like Blaxel or when using managed PostgreSQL services.
