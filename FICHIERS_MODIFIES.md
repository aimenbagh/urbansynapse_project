# Correction "pip: not found" → on utilise le Dockerfile

═══════════════════════════════════════════════════════════════
## CE QUI S'EST PASSÉ (bonne nouvelle au passage)
═══════════════════════════════════════════════════════════════
Le Root Directory = backend a MARCHÉ : Railway voit bien le dossier backend.
Nouvelle erreur "pip: not found" = Railpack lançait "pip install" SANS avoir
installé Python avant. 

## LA CORRECTION
On force Railway à utiliser le DOCKERFILE (qui installe Python proprement),
au lieu de Railpack + pip.

- `backend/railway.json` — builder = DOCKERFILE (au lieu de RAILPACK)
- `frontend/railway.json` — builder = DOCKERFILE
- `backend/Dockerfile` — Python 3.12 + gcc/libpq + deps + init DB + uvicorn.
  CMD en forme ["sh","-c", ...] pour bien lire $PORT.
- `frontend/Dockerfile` — build Vite (TS 5.6.3 épinglé) + sert avec "serve".
  ARG VITE_API_BASE_URL pour injecter l'URL de l'API AU BUILD.

═══════════════════════════════════════════════════════════════
## CE QUE TU DOIS FAIRE
═══════════════════════════════════════════════════════════════
1. Pousser :
       git add . && git commit -m "Railway: builder Dockerfile" && git push
2. Railway redéploie automatiquement. Si besoin, force dans chaque service :
       Settings → Build → Builder = "Dockerfile"
3. Garde les réglages déjà faits :
   BACKEND  : Root Directory = backend ; SECRET_KEY ; BACKEND_CORS_ORIGINS=*
   FRONTEND : Root Directory = frontend ; VITE_API_BASE_URL = https://URL-BACKEND/api/v1

IMPORTANT pour le frontend : VITE_API_BASE_URL doit être définie AVANT le build
(Vite l'intègre dans le build). Sur Railway, mets-la dans les Variables du
service frontend — elle sera passée au Dockerfile comme build arg.

═══════════════════════════════════════════════════════════════
## VÉRIFIÉ
═══════════════════════════════════════════════════════════════
- Backend : init_db + uvicorn OK ; Dockerfile installe Python+pip (plus de
  "pip: not found").
- Frontend : build avec TS 5.6.3 OK, URL de l'API bien intégrée au build.
