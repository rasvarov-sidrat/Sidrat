FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    BOOTSTRAP_DATABASE=false \
    SEED_DEMO_DATA=false

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml /app/backend/pyproject.toml

RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    cd backend && poetry install --no-interaction --no-ansi --only main

COPY backend /app/backend

WORKDIR /app/backend

EXPOSE 8000

CMD ["sh", "/app/backend/entrypoint.sh"]
