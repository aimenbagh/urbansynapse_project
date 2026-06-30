# Déploiement sur Railway — UrbanSynapse AI

Ce projet est un **monorepo** (backend + frontend séparés). L'erreur
"Railpack could not determine how to build" vient de là : Railway regardait
la racine et ne trouvait pas de point d'entrée. La solution = créer
**2 services**, chacun pointant vers son sous-dossier.

═══════════════════════════════════════════════════════════════
## ÉTAPE 1 — Pousser le code sur GitHub
═══════════════════════════════════════════════════════════════
    git add .
    git commit -m "Config Railway"
    git push

═══════════════════════════════════════════════════════════════
## ÉTAPE 2 — Service BACKEND (FastAPI)
═══════════════════════════════════════════════════════════════
1. Sur Railway : New Project → Deploy from GitHub repo → choisis ton repo.
2. Une fois le service créé : Settings → **Root Directory** = `backend`
   (TRÈS IMPORTANT : c'est ce qui règle l'erreur Railpack)
3. Settings → Variables, ajoute :
       SECRET_KEY = (une longue chaîne aléatoire)
       BACKEND_CORS_ORIGINS = *
       (optionnel) MISTRAL_API_KEY = ta_clé
4. (Recommandé) Ajoute une base PostgreSQL :
   New → Database → PostgreSQL. Railway crée une variable DATABASE_URL
   que le backend utilisera automatiquement.
   → Dans le service backend, Variables → Add Reference → DATABASE_URL
5. Deploy. Le backend démarre via le railway.json (init DB + uvicorn).
6. Settings → Networking → **Generate Domain** → copie l'URL
   (ex : https://backend-production-xxxx.up.railway.app)

═══════════════════════════════════════════════════════════════
## ÉTAPE 3 — Service FRONTEND (React/Vite)
═══════════════════════════════════════════════════════════════
1. Dans le MÊME projet Railway : New → GitHub Repo → le même repo.
2. Settings → **Root Directory** = `frontend`
3. Settings → Variables, ajoute :
       VITE_API_BASE_URL = https://TON-URL-BACKEND/api/v1
       (utilise l'URL backend de l'étape 2.6, suivie de /api/v1)
4. Deploy. Le frontend build puis se sert via vite preview.
5. Settings → Networking → Generate Domain → c'est l'URL de ton app !

═══════════════════════════════════════════════════════════════
## ÉTAPE 4 — Relier les deux (CORS)
═══════════════════════════════════════════════════════════════
Pour plus de sécurité, remplace dans le BACKEND la variable :
    BACKEND_CORS_ORIGINS = https://TON-URL-FRONTEND
(au lieu de *). Puis redéploie le backend.

═══════════════════════════════════════════════════════════════
## RÉCAPITULATIF DES VARIABLES
═══════════════════════════════════════════════════════════════
BACKEND :
    SECRET_KEY              = (chaîne aléatoire longue)
    BACKEND_CORS_ORIGINS    = *  (puis l'URL du frontend)
    DATABASE_URL            = (auto si tu ajoutes PostgreSQL ; sinon SQLite)
    MISTRAL_API_KEY         = (optionnel)

FRONTEND :
    VITE_API_BASE_URL       = https://URL-BACKEND/api/v1

═══════════════════════════════════════════════════════════════
## NOTES
═══════════════════════════════════════════════════════════════
- Le backend utilise un requirements.txt ALLÉGÉ (pas de geopandas/xgboost/
  celery) pour un build rapide. Le requirements complet est dans
  requirements-full.txt si besoin.
- Sans PostgreSQL, le backend utilise SQLite : ça marche, mais les données
  sont réinitialisées à chaque redéploiement. Pour des données persistantes,
  ajoute PostgreSQL (étape 2.4).
- La clé "Root Directory" par service est LE point essentiel pour un monorepo.
