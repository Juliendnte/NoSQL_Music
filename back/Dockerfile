# syntax=docker/dockerfile:1
FROM python:3.12-slim

# Binaire uv officiel, copié directement depuis son image (pas d'install pip nécessaire)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 1. On installe d'abord les dépendances seules -> ce layer est mis en cache
#    tant que pyproject.toml / uv.lock ne changent pas (rebuilds bien plus rapides)
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-install-project --no-dev

# 2. On copie le code applicatif
COPY api ./api

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "api.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
