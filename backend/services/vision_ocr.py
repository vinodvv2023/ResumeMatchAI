import base64
import io
from pathlib import Path

import httpx

from backend.config import GOOGLE_CLOUD_VISION_API_KEY


def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str) -> str:
    if not GOOGLE_CLOUD_VISION_API_KEY:
        raise RuntimeError("GOOGLE_CLOUD_VISION_API_KEY not set")

    ext = Path(filename).suffix.lower()
    images_b64 = []

    if ext == ".pdf":
        from pdf2image import convert_from_bytes
        pages = convert_from_bytes(file_bytes, dpi=300)
        for img in pages:
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            images_b64.append(base64.b64encode(buf.getvalue()).decode("ascii"))
    else:
        images_b64.append(base64.b64encode(file_bytes).decode("ascii"))

    api_url = "https://vision.googleapis.com/v1/images:annotate"
    all_text = []

    for i, img_b64 in enumerate(images_b64):
        payload = {
            "requests": [
                {
                    "image": {"content": img_b64},
                    "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                }
            ]
        }
        resp = httpx.post(
            api_url,
            json=payload,
            params={"key": GOOGLE_CLOUD_VISION_API_KEY},
            timeout=30,
        )
        if resp.status_code != 200:
            print(f"[OCR] Vision API page {i+1} error {resp.status_code}: {resp.text[:200]}")
            continue
        result = resp.json()
        for r in result.get("responses", []):
            ann = r.get("fullTextAnnotation", {})
            text = ann.get("text", "")
            if text:
                all_text.append(text)

    return "\n".join(all_text)
