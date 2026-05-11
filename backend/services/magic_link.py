import uuid
from datetime import datetime, timedelta
from backend.config import FRONTEND_URL, TOKEN_EXPIRY_DAYS


def generate_token() -> str:
    """Generate a cryptographically random UUID4 token."""
    return str(uuid.uuid4()).replace("-", "")


def generate_magic_link(token: str) -> str:
    """Build the full candidate-facing URL for a token."""
    return f"{FRONTEND_URL}/apply/{token}"


def get_expiry() -> str:
    """Return ISO timestamp TOKEN_EXPIRY_DAYS from now."""
    return (datetime.utcnow() + timedelta(days=TOKEN_EXPIRY_DAYS)).isoformat()


def is_expired(expires_at: str | None) -> bool:
    """Return True if the token's expiry has passed."""
    if not expires_at:
        return False
    try:
        return datetime.utcnow() > datetime.fromisoformat(expires_at)
    except ValueError:
        return False
