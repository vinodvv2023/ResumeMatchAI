import base64
import io
import json
from pathlib import Path
from typing import Any

import httpx

from backend.config import GOOGLE_CLOUD_VISION_API_KEY


def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str) -> str:
    if not GOOGLE_CLOUD_VISION_API_KEY:
        raise RuntimeError("GOOGLE_CLOUD_VISION_API_KEY not set")

    ext = Path(filename).suffix.lower()
    mime = "application/pdf" if ext == ".pdf" else "image/png"

    payload = {
        "requests": [
            {
                "image": {"content": base64.b64encode(file_bytes).decode("ascii")},
                "features": [
                    {"type": "DOCUMENT_TEXT_DETECTION"},
                ],
            }
        ]
    }

    url = f"https://vision.googleapis.com/v1/files:asyncBatchAnnotate"
    headers = {"Content-Type": "application/json"}

    async def _extract():
        async with httpx.AsyncClient(timeout=60) as client:
            if ext == ".pdf":
                resp = await client.post(url, json=payload, params={"key": GOOGLE_CLOUD_VISION_API_KEY}, headers=headers)
                resp.raise_for_status()
                result = resp.json()
                operation_name = result["name"]
                poll_url = f"https://vision.googleapis.com/v1/{operation_name}"
                import asyncio
                for _ in range(30):
                    await asyncio.sleep(2)
                    poll_resp = await client.get(poll_url, params={"key": GOOGLE_CLOUD_VISION_API_KEY})
                    poll_resp.raise_for_status()
                    poll_result = poll_resp.json()
                    if poll_result.get("done"):
                        responses = poll_result.get("responses", [])
                        full_text = []
                        for r in responses:
                            ann = r.get("fullTextAnnotation", {})
                            text = ann.get("text", "")
                            if text:
                                full_text.append(text)
                        return "\n".join(full_text)
                return ""
            else:
                resp = await client.post(
                    "https://vision.googleapis.com/v1/images:annotate",
                    json=payload,
                    params={"key": GOOGLE_CLOUD_VISION_API_KEY},
                    headers=headers,
                )
                resp.raise_for_status()
                result = resp.json()
                responses = result.get("responses", [])
                full_text = []
                for r in responses:
                    ann = r.get("fullTextAnnotation", {})
                    text = ann.get("text", "")
                    if text:
                        full_text.append(text)
                return "\n".join(full_text)

    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, _extract()).result(timeout=120)
        else:
            return asyncio.run(_extract())
    except RuntimeError:
        return asyncio.run(_extract())
