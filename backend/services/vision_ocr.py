import base64
import io
from pathlib import Path

import httpx

from backend.config import DEEPINFRA_API_TOKEN, VISION_MODEL


def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str) -> str:
    if not DEEPINFRA_API_TOKEN:
        raise RuntimeError("DEEPINFRA_API_TOKEN not set")

    ext = Path(filename).suffix.lower()
    images_b64 = []

    if ext == ".pdf":
        from pdf2image import convert_from_bytes
        pages = convert_from_bytes(file_bytes, dpi=300)
        print(f"[OCR] pdf2image converted {len(pages)} pages")
        for img in pages:
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            images_b64.append(base64.b64encode(buf.getvalue()).decode("ascii"))
            print(f"[OCR] page image size: {buf.tell()} bytes")
    else:
        images_b64.append(base64.b64encode(file_bytes).decode("ascii"))

    api_url = "https://api.deepinfra.com/v1/openai/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPINFRA_API_TOKEN}",
        "Content-Type": "application/json",
    }

    all_text = []
    for i, img_b64 in enumerate(images_b64):
        payload = {
            "model": VISION_MODEL,
            "max_tokens": 4092,
            "temperature": 0.0,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "image": f"data:image/png;base64,{img_b64}",
                        },
                        {
                            "type": "text",
                            "text": "Extract ALL text from this document page exactly as written. Preserve formatting, line breaks, and structure. Output only the extracted text, nothing else.",
                        },
                    ],
                },
            ],
        }

        try:
            resp = httpx.post(api_url, json=payload, headers=headers, timeout=60)
            if resp.status_code != 200:
                print(f"[OCR] Vision API page {i+1} error {resp.status_code}: {resp.text[:300]}")
                continue
            result = resp.json()
            choice = result["choices"][0]
            text = choice.get("message", {}).get("content", "")
            if i == 0:
                print(f"[OCR] Vision API response: finish_reason={choice.get('finish_reason')}, content_len={len(text)}")
            if text:
                all_text.append(text.strip())
        except Exception as e:
            print(f"[OCR] Vision model page {i+1} error: {type(e).__name__}: {e}")
            continue

    return "\n".join(all_text)
