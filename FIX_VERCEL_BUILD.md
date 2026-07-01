# Erreur Vercel : "react-scripts: command not found"

═══════════════════════════════════════════════════════════════
## LA CAUSE
═══════════════════════════════════════════════════════════════
Vercel lance "react-scripts build" (commande de Create React App).
MAIS ton projet utilise VITE, pas react-scripts.
→ Vercel a un mauvais réglage de build qui écrase ton vercel.json.

═══════════════════════════════════════════════════════════════
## LA SOLUTION (dans l'interface Vercel)
═══════════════════════════════════════════════════════════════
1. Vercel → ton projet → onglet SETTINGS
2. Section "Build & Development Settings"
3. Corrige ces 4 champs :

   Framework Preset  = Vite
                       (PAS "Create React App")

   Build Command     = npm run build
                       (désactive l'Override, ou mets exactement ça)
                       (SURTOUT PAS "react-scripts build")

   Output Directory  = dist
                       (PAS "build")

   Install Command   = npm install
                       (par défaut, laisse tel quel)

4. Clique "Save".
5. Onglet Deployments → dernier déploiement → "..." → Redeploy
   (décoche "Use existing Build Cache").

═══════════════════════════════════════════════════════════════
## VÉRIFIE AUSSI : Root Directory
═══════════════════════════════════════════════════════════════
Settings → General (ou Build settings) → "Root Directory"
   Root Directory = frontend
Ton frontend est dans le sous-dossier "frontend", Vercel doit le savoir.

═══════════════════════════════════════════════════════════════
## VÉRIFIE QUE vercel.json EST SUR GITHUB
═══════════════════════════════════════════════════════════════
Ouvre ton repo GitHub → dossier "frontend".
Tu DOIS y voir "vercel.json". S'il n'y est pas :
    git add frontend/vercel.json
    git commit -m "Ajout vercel.json"
    git push

Contenu attendu de frontend/vercel.json :
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}

═══════════════════════════════════════════════════════════════
## POURQUOI ÇA ARRIVE
═══════════════════════════════════════════════════════════════
Quand tu as importé le projet, Vercel a peut-être détecté (à tort) Create
React App, ou tu as choisi ce preset. Une fois le Framework mis sur "Vite"
et le Build Command corrigé, le déploiement passera.

Ton package.json est CORRECT (build = "tsc -b && vite build"), le problème
est 100% dans les réglages Vercel.
