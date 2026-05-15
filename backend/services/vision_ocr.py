import base64
import io
from pathlib import Path

from openai import OpenAI

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
            img_size = buf.tell()
            images_b64.append(base64.b64encode(buf.getvalue()).decode("ascii"))
            print(f"[OCR] page image size: {img_size} bytes")
    else:
        images_b64.append(base64.b64encode(file_bytes).decode("ascii"))

    print(f"[OCR] Vision model: {VISION_MODEL}, pages to process: {len(images_b64)}")

    client = OpenAI(
        api_key=DEEPINFRA_API_TOKEN,
        base_url="https://api.deepinfra.com/v1/openai",
    )

    all_text = []
    for i, img_b64 in enumerate(images_b64):
        try:
            response = client.chat.completions.create(
                model=VISION_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Extract ALL text from this document page exactly as written. Preserve formatting, line breaks, and structure. Output only the extracted text, nothing else.",
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
                        ],
                    },
                ],
                temperature=0.0,
            )
            text = response.choices[0].message.content
            if text:
                all_text.append(text.strip())
        except Exception as e:
            print(f"[OCR] Vision model page {i+1} error: {type(e).__name__}: {e}")
            continue

    return "\n".join(all_text)
