# Installation sur Windows — UrbanSynapse AI (backend)

## Pourquoi l'installation initiale a échoué

Les paquets géospatiaux (`pyproj`, `shapely`, `geopandas`, `rasterio`) dépendent des
bibliothèques système **PROJ** et **GDAL**. Quand `pip` ne trouve pas de *wheel*
précompilé correspondant à ta version de Python, il tente de **compiler depuis les
sources**, ce qui échoue avec :

```
proj executable not found. Please set the PROJ_DIR variable.
```

Comme l'installation s'est arrêtée à ce point, `uvicorn` et `alembic` n'ont jamais
été installés — d'où les messages « is not recognized ».

---

## Solution recommandée : Docker

Depuis la racine `urbansynapse/` :

```cmd
docker compose up --build
```

- API + Swagger : http://localhost:8000/docs
- Frontend : http://localhost:5173

Tout le géospatial est déjà dans les images. Rien à compiler.

---

## Solution alternative : installation locale Windows

### 1. Vérifier la version de Python

Les wheels géospatiaux existent pour Python **3.10 → 3.12**.
Avec Python **3.13** (ce que tu utilises, cf. `cp313` dans le log), certains
wheels n'existent pas encore et pip retombe sur la compilation.

```cmd
python --version
```

> Si tu es en 3.13 : installe Python 3.12 (python.org) et recrée le venv :
> ```cmd
> py -3.12 -m venv .venv
> .venv\Scripts\activate
> ```

### 2. Mettre pip à jour (important : pip récent = meilleurs wheels)

```cmd
python -m pip install --upgrade pip
```

### 3. Option A — démarrage rapide SANS géospatial

Pour lancer l'API immédiatement et tester le scoring / la simulation énergétique :

```cmd
pip install -r requirements-core.txt
```

Les modules `app/gis/operations.py` (qui importent shapely/pyproj) ne sont pas
chargés au démarrage de l'API, donc tout fonctionne sans eux.

### 4. Option B — installation complète avec géospatial

```cmd
pip install -r requirements.txt
```

Si `pyproj` ou `shapely` échouent encore, installe-les via **conda** qui gère
PROJ/GDAL automatiquement :

```cmd
conda install -c conda-forge geopandas shapely pyproj
pip install -r requirements-core.txt
```

### 5. Lancer l'application

```cmd
copy .env.example .env

REM utiliser python -m pour éviter les soucis de PATH du venv
python -m alembic upgrade head        REM nécessite PostgreSQL+PostGIS lancé
python -m uvicorn app.main:app --reload
```

> Astuce : tant que `uvicorn`/`alembic` ne sont pas reconnus comme commandes,
> utilise toujours le préfixe `python -m` (ex. `python -m uvicorn ...`).
> Cela appelle le module installé dans le venv sans dépendre du PATH.

### 6. Sans base de données ?

Tu peux sauter `alembic upgrade head` et tester les endpoints de calcul pur :

```cmd
python -m uvicorn app.main:app --reload
```

Puis ouvre http://localhost:8000/docs et essaie `POST /api/v1/energy/retrofit`.

---

## Frontend — pièges fréquents

### ⚠️ Ne PAS lancer `npm audit fix --force`
Cette commande force des versions majeures incompatibles (Vite 8, Vitest 4) et
**casse le projet** (`Invalid key: "jsx"`, page sans styles). Les vulnérabilités
signalées concernent des dépendances de développement, sans impact en production.

Si tu l'as déjà lancée, restaure les bonnes versions :
```cmd
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
```
Le `package.json` épingle désormais Vite 5 / Vitest 2 / plugin-react 4 (compatibles).

### La page s'affiche sans aucun style ?
Cela signifie que Tailwind n'est pas compilé. Vérifie la présence de ces 3 fichiers
à la racine de `frontend/` :
- `postcss.config.js`  ← branche Tailwind dans Vite (indispensable)
- `tailwind.config.js`
- `src/styles/index.css` (contient les directives `@tailwind`)

Puis relance `npm run dev`.

### Lancer le frontend
```cmd
cd frontend
npm install
copy .env.example .env
npm run dev
```
Ouvre http://localhost:5173

> Le backend doit tourner en parallèle (`python -m uvicorn app.main:app --reload`)
> pour que les appels API fonctionnent. L'API n'a pas de page sur `/` :
> utilise http://localhost:8000/docs (Swagger) et http://localhost:8000/health.
