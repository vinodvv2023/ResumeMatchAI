from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_PATH = os.getenv("DATABASE_PATH", "resumereader.db")
DATABASE_URL  = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

BASE_URL          = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL      = os.getenv("FRONTEND_URL", "http://localhost:5173")
PASS_THRESHOLD    = int(os.getenv("PASS_THRESHOLD", "60"))
TOKEN_EXPIRY_DAYS = int(os.getenv("TOKEN_EXPIRY_DAYS", "7"))

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".rtf", ".txt"}
MAX_FILE_SIZE_MB   = 10
