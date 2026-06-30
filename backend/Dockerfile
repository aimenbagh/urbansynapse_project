FROM python:3.12-slim

WORKDIR /app

# Dépendances système minimales
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY . .

# Railway fournit $PORT
ENV PORT=8000
EXPOSE 8000

# Init DB puis démarrage
CMD ["sh", "-c", "python -m scripts.init_db && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
