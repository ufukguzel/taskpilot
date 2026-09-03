FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# SQLite database lives on a mounted volume at /data by default.
ENV DATABASE_URL=sqlite:////data/taskpilot.db
EXPOSE 8000

# Bind to $PORT when the platform provides one (e.g. Render); default 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
