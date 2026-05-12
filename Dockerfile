# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 8080
ENV HOST 0.0.0.0

# Install system dependencies for OCR and PDF processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    gcc \
    python3-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Create uploads directory
RUN mkdir -p uploads

# Expose the port
EXPOSE 8080

# Run the application using uvicorn with debug logging
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "debug"]
