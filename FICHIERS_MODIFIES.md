# Déploiement : Backend Railway + Frontend Vercel

═══════════════════════════════════════════════════════════════
## FRONTEND → VERCEL (nouveau)
═══════════════════════════════════════════════════════════════
- `frontend/vercel.json` — NOUVEAU
  * framework Vite, build → dist
  * routage SPA : toutes les routes renvoient index.html
    (recharger /wilaya/16 ne fera plus 404)
- `frontend/.vercelignore` — NOUVEAU
- `frontend/package.json` — TypeScript FIGÉ à 5.6.3 (exact, sans ^)
  pour éviter que Vercel installe TS 6+ qui casse le build.

═══════════════════════════════════════════════════════════════
## BACKEND → RAILWAY (déjà configuré)
═══════════════════════════════════════════════════════════════
Inchangé : backend/Dockerfile + railway.json + requirements.txt.
Root Directory = backend, Builder = Dockerfile.

═══════════════════════════════════════════════════════════════
## GUIDE COMPLET : DEPLOIEMENT.md
═══════════════════════════════════════════════════════════════
RÉSUMÉ :
1. BACKEND (Railway) :
   - Root Directory = backend, Builder = Dockerfile
   - Variables : SECRET_KEY, BACKEND_CORS_ORIGINS=* (+ PostgreSQL)
   - Generate Domain → note l'URL.
2. FRONTEND (Vercel) :
   - vercel.com → Import repo → Root Directory = frontend
   - Variable : VITE_API_BASE_URL = https://URL-BACKEND/api/v1
   - Deploy → URL de ton app.
3. Sécuriser : BACKEND_CORS_ORIGINS = https://URL-VERCEL (puis redéployer backend).

IMPORTANT : sur Vercel, VITE_API_BASE_URL est lue AU BUILD → si tu la changes,
redéploie le frontend.

Vérifié : build frontend OK avec TS 5.6.3, URL API intégrée, vercel.json valide.
