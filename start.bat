@echo off
echo =========================================
echo   Starting ResumeReader Platform
echo =========================================

:: Start FastAPI Backend
echo [1/2] Starting FastAPI Backend on port 8000...
start cmd /k ".\.venv\Scripts\uvicorn backend.main:app --reload --port 8000"

:: Start Vite Frontend
echo [2/2] Starting React Frontend on port 5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo All services started!
echo Admin Dashboard: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
pause
