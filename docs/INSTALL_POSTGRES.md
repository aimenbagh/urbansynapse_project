# Installation PostgreSQL + PostGIS sur Windows

## Pourquoi cette erreur ?

```
psycopg2.OperationalError: connection to server at "localhost" port 5432
failed: Connection refused
```

Le code essaie de se connecter à PostgreSQL, mais **aucun serveur PostgreSQL
ne tourne** sur ta machine. Il faut l'installer et le démarrer.

> Important : **n'utilise PAS `alembic upgrade head`** — le projet n'a pas encore
> de migrations générées. Utilise `python -m scripts.init_db` qui crée les tables.

---

## Étape 1 — Installer PostgreSQL

1. Télécharge l'installeur Windows depuis EnterpriseDB :
   https://www.postgresql.org/download/windows/
   (choisis PostgreSQL 16 ou 17 — évite la toute dernière 18 pour l'instant,
   le bundle PostGIS n'y est pas toujours disponible dans StackBuilder).
2. Lance l'installeur, accepte les valeurs par défaut.
3. **Note bien le mot de passe** que tu définis pour l'utilisateur `postgres`.
4. Laisse le port par défaut : **5432**.

## Étape 2 — Installer PostGIS via Stack Builder

1. À la fin de l'installation, **Stack Builder** se lance (sinon, cherche
   "Stack Builder" dans le menu Démarrer).
2. Sélectionne ton instance PostgreSQL dans la liste.
3. Déplie **Spatial Extensions** et coche **PostGIS ... Bundle** (dernière version).
4. Accepte les valeurs par défaut et installe.

## Étape 3 — Vérifier que le serveur tourne

Ouvre les Services Windows (`services.msc`) et vérifie que le service
**postgresql-x64-16** (ou 17) est bien **En cours d'exécution**.

Ou en ligne de commande :
```cmd
psql -U postgres -c "SELECT version();"
```
(si `psql` n'est pas reconnu, ajoute `C:\Program Files\PostgreSQL\16\bin` au PATH,
ou utilise le chemin complet).

---

## Étape 4 — Créer la base et le rôle applicatif

Ouvre **pgAdmin** (installé avec PostgreSQL) ou le terminal `psql` :

```cmd
psql -U postgres
```

Puis exécute (mot de passe `postgres` = celui défini à l'installation) :

```sql
-- Créer le rôle applicatif
CREATE ROLE urbansynapse LOGIN PASSWORD 'urbansynapse';

-- Créer la base
CREATE DATABASE urbansynapse OWNER urbansynapse;

-- Se connecter à la nouvelle base
\c urbansynapse

-- Activer PostGIS
CREATE EXTENSION postgis;

-- Vérifier
SELECT postgis_version();

\q
```

---

## Étape 5 — Configurer le projet

Dans `backend/.env`, mets la ligne PostgreSQL (et commente SQLite) :

```env
# DATABASE_URL=sqlite:///./urbansynapse.db
DATABASE_URL=postgresql+psycopg2://urbansynapse:urbansynapse@localhost:5432/urbansynapse
```

> Si tu as mis un mot de passe différent pour le rôle `urbansynapse`,
> remplace-le dans l'URL : `...://urbansynapse:TON_MOT_DE_PASSE@localhost...`

---

## Étape 6 — Créer les tables et lancer

```cmd
cd backend
.venv\Scripts\activate
python -m scripts.init_db          REM cree les tables + donnees de demo
python -m uvicorn app.main:app --reload
```

`init_db` active automatiquement l'extension PostGIS si elle ne l'est pas déjà,
crée les tables (avec vraies colonnes géométriques), et insère Alger / Oran.

Ouvre http://localhost:8000/docs et teste `GET /api/v1/territories/`.

---

## Tu préfères éviter toute cette installation ?

Repasse en **SQLite** (aucune installation) : dans `.env`, garde simplement
la ligne `DATABASE_URL=sqlite:///./urbansynapse.db` et lance
`python -m scripts.init_db`. Voir `docs/INSTALL_SQLITE.md`.

---

## Dépannage

| Erreur | Cause / Solution |
|--------|------------------|
| `Connection refused ... port 5432` | Le service PostgreSQL n'est pas démarré (services.msc) |
| `password authentication failed` | Mot de passe incorrect dans `DATABASE_URL` |
| `database "urbansynapse" does not exist` | Étape 4 non faite (CREATE DATABASE) |
| `could not open extension control file ... postgis` | PostGIS non installé (Stack Builder, étape 2) |
| `type "geometry" does not exist` | Extension PostGIS non activée : `CREATE EXTENSION postgis;` |
