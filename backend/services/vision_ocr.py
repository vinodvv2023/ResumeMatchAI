import base64
from pathlib import Path

from openai import OpenAI

from backend.config import DEEPINFRA_API_TOKEN, VISION_MODEL


def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str) -> str:
    if not DEEPINFRA_API_TOKEN:
        raise RuntimeError("DEEPINFRA_API_TOKEN not set")

    ext = Path(filename).suffix.lower()
    images_b64 = []

    if ext == ".pdf":
        import fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        print(f"[OCR] PyMuPDF vision: {len(doc)} pages")
        for page in doc:
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")
            images_b64.append(base64.b64encode(img_bytes).decode("ascii"))
            print(f"[OCR] page image size: {len(img_bytes)} bytes")
        doc.close()
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
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{img_b64}"},
                            },
                            {
                                "type": "text",
                                "text": "Extract ALL text from this document page exactly as written. Preserve formatting, line breaks, and structure. Output only the extracted text, nothing else.",
                            },
                        ],
                    },
                ],
                temperature=0.0,
                max_tokens=4092,
            )
            text = response.choices[0].message.content or ""
            print(f"[OCR] Vision page {i+1}: finish_reason={response.choices[0].finish_reason}, content_len={len(text)}")
            if text:
                all_text.append(text.strip())
        except Exception as e:
            print(f"[OCR] Vision page {i+1} error: {type(e).__name__}: {e}")
            continue

    return "\n".join(all_text)
