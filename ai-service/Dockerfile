FROM python:3.13-slim

WORKDIR /app

# Install system dependencies required for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libxcb1 \
    libx11-xcb1 \
    libx11-6 \
    libxext6 \
    libsm6 \
    libxrender1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Use shell form to allow variable expansion for PORT
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
