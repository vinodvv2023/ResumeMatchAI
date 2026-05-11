import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base

# Create tables if they don't exist (though PlanDB handles this too)
Base.metadata.create_all(bind=engine)

from backend.routers import jobs, apply, applications

app = FastAPI(title="ResumeReader API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jobs.router)
app.include_router(apply.router)
app.include_router(applications.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "resumereader-api"}
