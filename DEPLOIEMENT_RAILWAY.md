# Déploiement Railway — GUIDE PRÉCIS

## ⚠️ LA CAUSE DE TON ERREUR
L'erreur "Railpack could not determine how to build" + la liste qui montre
"./  ├── backend/  ├── frontend/ ..." signifie que Railway regarde la RACINE
du repo. Comme il y a backend ET frontend, il ne sait pas quoi construire.

LA SOLUTION = régler le "Root Directory" du service. C'est UN seul réglage,
mais il est OBLIGATOIRE. Tant qu'il n'est pas fait, l'erreur revient.

═══════════════════════════════════════════════════════════════════════
## RÉGLER LE ROOT DIRECTORY (l'étape qui débloque tout)
═══════════════════════════════════════════════════════════════════════
1. Ouvre ton service sur Railway.
2. Clique sur l'onglet **Settings**.
3. Cherche la section **"Source"** (ou "Service Source").
4. Tu vois un champ **"Root Directory"** (souvent vide ou "/").
5. Mets dedans :  backend     (pour le service backend)
              ou :  frontend    (pour le service frontend)
6. Clique sur **"Update"** / la coche de validation.
7. Va dans l'onglet **Deployments** → bouton **"Deploy"** (ou Redeploy).

>>> Une fois Root Directory = "backend", Railway ne verra QUE le dossier
    backend (avec son Dockerfile / railway.json) et le build réussira.

═══════════════════════════════════════════════════════════════════════
## PROCÉDURE COMPLÈTE (2 services)
═══════════════════════════════════════════════════════════════════════

### A. Pousser le code
    git add .
    git commit -m "Railway: Dockerfiles + config"
    git push

### B. Service BACKEND
1. New Project → Deploy from GitHub repo → ton repo.
2. Settings → Source → **Root Directory = backend** → Update.
3. Settings → Variables :
       SECRET_KEY            = (une longue chaîne au hasard)
       BACKEND_CORS_ORIGINS  = *
4. (Recommandé) New → Database → PostgreSQL. Puis dans le service backend :
   Variables → New Variable → Add Reference → choisis DATABASE_URL.
5. Deployments → Deploy. Attends le build (le Dockerfile s'en charge).
6. Settings → Networking → **Generate Domain**. Copie l'URL obtenue.
   (ex : https://urbansynapse-backend-production.up.railway.app)
   → Teste : ouvre cette URL, tu dois voir {"status":"ok",...}

### C. Service FRONTEND
1. Dans le MÊME projet : bouton "+ New" → GitHub Repo → le même repo.
2. Settings → Source → **Root Directory = frontend** → Update.
3. Settings → Variables :
       VITE_API_BASE_URL = https://TON-URL-BACKEND/api/v1
   (l'URL de l'étape B.6, suivie de /api/v1)
4. Deployments → Deploy.
5. Settings → Networking → Generate Domain.
   → CETTE URL = ton application en ligne. 🎉

### D. Sécuriser le CORS (optionnel)
Dans le backend, remplace BACKEND_CORS_ORIGINS = *  par l'URL exacte du
frontend, puis redéploie le backend.

═══════════════════════════════════════════════════════════════════════
## COMMENT ÇA MARCHE (ce que j'ai préparé)
═══════════════════════════════════════════════════════════════════════
- backend/Dockerfile  : Railway le détecte, installe Python + deps, init la
  base, lance uvicorn sur $PORT. (railway.json existe aussi en secours.)
- frontend/Dockerfile : build Vite puis sert le résultat avec "serve" sur $PORT.
- Les deux écoutent sur le $PORT que Railway impose automatiquement.

═══════════════════════════════════════════════════════════════════════
## SI ÇA ÉCHOUE ENCORE
═══════════════════════════════════════════════════════════════════════
- Vérifie que Root Directory est bien "backend" (sans slash, sans majuscule)
  et que tu as cliqué Update PUIS redéployé.
- Dans Settings → Build, le "Builder" peut être mis sur "Dockerfile" pour
  forcer l'usage du Dockerfile.
- Regarde les logs de build (onglet Deployments → le déploiement → View logs).

