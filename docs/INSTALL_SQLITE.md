# Démarrage en mode SQLite (sans PostgreSQL, sans Docker)

Mode le plus simple pour développer : aucune base à installer.
SQLite crée un simple fichier `urbansynapse.db` dans `backend/`.

> Limitation : SQLite ne gère pas PostGIS. Les colonnes géométriques sont
> stockées en texte (GeoJSON/WKT). Les calculs SIG avancés nécessiteront
> PostgreSQL/PostGIS plus tard. Pour développer l'interface, les KPIs,
> les scénarios et la simulation énergétique, SQLite suffit.

## Étapes

```cmd
cd backend
.venv\Scripts\activate

REM 1. Configurer l'environnement (SQLite est deja la valeur par defaut)
copy .env.example .env

REM 2. Creer les tables + inserer les donnees de demonstration
python -m scripts.init_db

REM 3. Lancer l'API
python -m uvicorn app.main:app --reload
```

Compte de démonstration créé :
- **Email** : admin@urbansynapse.ai
- **Mot de passe** : admin123

## Vérifier

http://localhost:8000/docs puis teste :
- `GET /api/v1/territories/` → Alger et Oran
- `GET /api/v1/indicators/?territory_id=1` → KPIs d'Alger
- `POST /api/v1/energy/retrofit` → simulation de rénovation
- `POST /api/v1/scenarios/` → création + scoring d'un scénario

## Repartir de zéro

```cmd
del urbansynapse.db
python -m scripts.init_db
```

## Passer à PostgreSQL/PostGIS plus tard

Dans `.env`, commente la ligne SQLite et décommente la ligne PostgreSQL.
Les modèles s'adaptent automatiquement (vrai type Geometry PostGIS).
