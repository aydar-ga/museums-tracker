# --- Build stage: resolve runtime dependencies from poetry.lock -------------
FROM python:3.13-slim AS build

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_VERSION=2.5.2 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1

RUN pip install "poetry==${POETRY_VERSION}"

WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root

# --- Runtime stage: app code + virtualenv, no Poetry, non-root ---------------
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY app.py ./
COPY static ./static
COPY templates ./templates

RUN useradd --create-home --uid 10001 app
USER app

# Render injects PORT; 5000 is the local default.
EXPOSE 5000
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --access-logfile - app:app"]
