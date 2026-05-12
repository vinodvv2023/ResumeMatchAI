import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ResumeReader API", version="1.0.0")

# Setup CORS — allow all origins in production (tighten later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ResumeMatch AI API is live!", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "resumereader-api"}

# Initialize DB safely AFTER app is created
from backend.database import engine, Base
try:
    print(f"DEBUG: Initializing DB: {os.getenv('DATABASE_URL', 'sqlite')[:30]}...")
    Base.metadata.create_all(bind=engine)
    print("DEBUG: DB init successful.")
except Exception as e:
    print(f"ERROR: DB init failed: {str(e)}")

# Include routers AFTER app and DB are set up
from backend.routers import jobs, apply, applications
app.include_router(jobs.router)
app.include_router(apply.router)
app.include_router(applications.router)

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host=host, port=port)
