# Déploiement Railway — Dockerfiles + LE réglage qui débloque

═══════════════════════════════════════════════════════════════
## CE QUI BLOQUE (à faire ABSOLUMENT sur Railway)
═══════════════════════════════════════════════════════════════
L'erreur revient parce que le service Railway regarde la RACINE du repo.
Il FAUT régler, dans CHAQUE service :

    Settings → Source → Root Directory

  * Service backend  →  Root Directory = backend
  * Service frontend →  Root Directory = frontend

Puis cliquer Update et redéployer. SANS ce réglage, l'erreur "could not
determine how to build" reviendra toujours, quels que soient les fichiers.

>>> Guide pas-à-pas détaillé : DEPLOIEMENT_RAILWAY.md

═══════════════════════════════════════════════════════════════
## FICHIERS AJOUTÉS (pour fiabiliser le build)
═══════════════════════════════════════════════════════════════
- `backend/Dockerfile` — Railway le détecte une fois Root Directory=backend :
  Python 3.12, install deps, init DB, uvicorn sur $PORT.
- `frontend/Dockerfile` — build Vite (avec TS 5.6.3) puis sert le résultat
  avec "serve" sur $PORT.
- `backend/.dockerignore` + `frontend/.dockerignore` — builds plus rapides.

═══════════════════════════════════════════════════════════════
## ORDRE DES OPÉRATIONS
═══════════════════════════════════════════════════════════════
1. git add . && git commit -m "Railway dockerfiles" && git push
2. Service BACKEND : Root Directory = backend ; variables SECRET_KEY +
   BACKEND_CORS_ORIGINS=* (+ PostgreSQL) ; Generate Domain.
3. Service FRONTEND : Root Directory = frontend ; variable
   VITE_API_BASE_URL = https://URL-BACKEND/api/v1 ; Generate Domain.

Astuce : si besoin, Settings → Build → Builder = "Dockerfile" pour forcer.

Vérifié : commandes des Dockerfiles testées (init_db OK, app importable OK,
build frontend OK).
