# Déploiement — Backend sur Railway, Frontend sur Vercel

═══════════════════════════════════════════════════════════════
## PARTIE 1 — BACKEND sur RAILWAY
═══════════════════════════════════════════════════════════════
1. Pousser le code sur GitHub :
       git add -A && git commit -m "deploy" && git push
2. Railway → New Project → Deploy from GitHub repo → ton repo.
3. Service → Settings → Source → **Root Directory = backend** → Update.
4. Settings → Build → Builder = **Dockerfile** (si pas auto-détecté).
5. Settings → Variables :
       SECRET_KEY            = (longue chaîne aléatoire)
       BACKEND_CORS_ORIGINS  = *     (on restreindra après, étape 3)
6. (Recommandé) New → Database → PostgreSQL.
   Puis service backend → Variables → New → Add Reference → DATABASE_URL.
7. Deploy. Attends le build (Dockerfile : Python + deps + init DB + uvicorn).
8. Settings → Networking → **Generate Domain** → copie l'URL.
   Teste-la dans le navigateur → tu dois voir {"status":"ok",...}
   >>> NOTE cette URL, ex : https://urbansynapse-backend.up.railway.app

═══════════════════════════════════════════════════════════════
## PARTIE 2 — FRONTEND sur VERCEL
═══════════════════════════════════════════════════════════════
1. Va sur vercel.com → New Project → Import ton repo GitHub.
2. Vercel détecte le projet. Configure :
       Framework Preset  = Vite
       **Root Directory  = frontend**   (clique "Edit" à côté de Root Directory)
   (Build Command et Output sont déjà bons via vercel.json : npm run build → dist)
3. Section **Environment Variables**, ajoute :
       Name  = VITE_API_BASE_URL
       Value = https://TON-URL-BACKEND/api/v1
   (l'URL Railway de la Partie 1, étape 8, suivie de /api/v1)
4. Clique **Deploy**. Vercel build et te donne une URL
   (ex : https://urbansynapse.vercel.app) = ton app en ligne !

═══════════════════════════════════════════════════════════════
## PARTIE 3 — SÉCURISER LE CORS
═══════════════════════════════════════════════════════════════
Retourne dans Railway (backend) → Variables :
    BACKEND_CORS_ORIGINS = https://TON-URL-VERCEL
(remplace le *). Redéploie le backend.

═══════════════════════════════════════════════════════════════
## RÉCAP DES VARIABLES
═══════════════════════════════════════════════════════════════
RAILWAY (backend) :
    SECRET_KEY            = ...
    BACKEND_CORS_ORIGINS  = https://ton-app.vercel.app
    DATABASE_URL          = (auto via PostgreSQL)
    MISTRAL_API_KEY       = (optionnel)

VERCEL (frontend) :
    VITE_API_BASE_URL     = https://ton-backend.up.railway.app/api/v1

═══════════════════════════════════════════════════════════════
## IMPORTANT
═══════════════════════════════════════════════════════════════
- Sur Vercel, VITE_API_BASE_URL est lue AU BUILD. Si tu la changes,
  il faut REDÉPLOYER le frontend (Deployments → ... → Redeploy).
- Le vercel.json gère le routage SPA : recharger /wilaya/16 ne fera plus 404.
- Si le build Vercel échoue sur TypeScript : c'est déjà réglé (TS figé à 5.6.3).
