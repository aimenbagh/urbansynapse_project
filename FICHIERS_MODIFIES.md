# Configuration de déploiement Railway

## Pourquoi l'erreur "Railpack could not determine how to build"
Ton repo est un MONOREPO (backend + frontend). Railway regardait la racine et
ne trouvait pas de point d'entrée. Solution : 2 services, chacun avec son
"Root Directory" (backend / frontend).

>>> LIS LE GUIDE COMPLET : DEPLOIEMENT_RAILWAY.md (étape par étape)

═══════════════════════════════════════════════════════════════
## FICHIERS BACKEND
═══════════════════════════════════════════════════════════════
- `backend/railway.json` — build (pip install) + start (init DB + uvicorn sur $PORT)
- `backend/Procfile` — fallback de démarrage
- `backend/runtime.txt` — Python 3.12
- `backend/requirements.txt` — ALLÉGÉ (sans geopandas/xgboost/celery, inutiles
  au runtime) → build Railway rapide. Le complet est dans requirements-full.txt.
- `backend/app/core/config.py` — robuste pour le cloud :
  * DATABASE_URL a une valeur par défaut (SQLite) et corrige postgres:// → postgresql://
  * BACKEND_CORS_ORIGINS accepte une chaîne "a.com,b.com" ou "*"
- `backend/app/main.py` — route racine "/" + CORS gère "*"
- `backend/data/processed/algeria_timeseries.json` — données ML (forecasting)

═══════════════════════════════════════════════════════════════
## FICHIERS FRONTEND
═══════════════════════════════════════════════════════════════
- `frontend/railway.json` — build (npm build) + start (vite preview sur $PORT)
- `frontend/package.json` — script "start" pour servir le build
- `frontend/vite.config.ts` — preview autorise les domaines Railway (allowedHosts)

═══════════════════════════════════════════════════════════════
## EN BREF (voir DEPLOIEMENT_RAILWAY.md pour le détail)
═══════════════════════════════════════════════════════════════
1. Push sur GitHub.
2. Railway → service BACKEND → Root Directory = "backend"
   Variables : SECRET_KEY, BACKEND_CORS_ORIGINS=* (+ PostgreSQL recommandé)
   → Generate Domain → copie l'URL.
3. Railway → service FRONTEND → Root Directory = "frontend"
   Variable : VITE_API_BASE_URL = https://URL-BACKEND/api/v1
   → Generate Domain = ton app en ligne.

Vérifié : backend simulé en conditions Railway (init DB, 58 wilayas, forecast,
route /), frontend servi en preview (HTTP 200). Build OK, 3 tests backend OK.
