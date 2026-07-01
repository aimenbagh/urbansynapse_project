# Intégration des données réelles + documents + carte

═══════════════════════════════════════════════════════════════
## 1. DONNÉES RÉELLES : POPULATION DES COMMUNES D'ALGER (RGPH 2008)
═══════════════════════════════════════════════════════════════
Extraites de ton fichier "Pop EXHAUSTIF W 16 RGPH 2008.xls" :
population réelle par commune + taux d'accroissement.

- `backend/app/data/communes_alger.py` — NOUVEAU : 58 communes d'Alger
  (population réelle, 31 avec coordonnées cartographiques)
- `backend/app/api/v1/endpoints/layers.py` — + endpoint /layers/{id}/communes

═══════════════════════════════════════════════════════════════
## 2. NOUVELLE COUCHE CARTE : "Communes (population réelle)"
═══════════════════════════════════════════════════════════════
Sur la page Analyse territoriale, nouveau bouton de couche "Communes
(population réelle)" :
- points dimensionnés selon la population réelle de chaque commune
- étiquettes avec le nom de la commune
- clic → population 2008 + taux d'accroissement + source RGPH

- `frontend/src/api/layers.ts` — + fetchCommunesLayer
- `frontend/src/pages/TerritorialAnalysisPage.tsx` — + bouton Communes
- `frontend/src/components/map/TerritoryMap.tsx` — rendu de la couche

═══════════════════════════════════════════════════════════════
## 3. DOCUMENTS DE RÉFÉRENCE (à consulter dans l'app)
═══════════════════════════════════════════════════════════════
Un script charge tes 10 documents dans la base (consultables via le menu
Documents) : Bilan énergétique, Population Alger, RPA 2024, Mobilité urbaine,
Armature urbaine, Réglementation thermique, etc.

- `backend/scripts/seed_documents.py` — NOUVEAU

>>> Les FICHIERS des documents (~31 Mo) sont dans le PROJET COMPLET
    (urbansynapse_project.zip), dossier backend/seed_documents/.
    Ils ne sont pas dans ce petit zip à cause de leur taille.

═══════════════════════════════════════════════════════════════
## INSTALLATION
═══════════════════════════════════════════════════════════════
BACKEND :
    cd backend
    .venv\Scripts\python.exe -m scripts.init_db
    .venv\Scripts\python.exe -m scripts.seed_documents   ← charge les 10 documents
    .venv\Scripts\python.exe -m uvicorn app.main:app --reload

    (le seed_documents nécessite le dossier backend/seed_documents/ présent :
     prends-le depuis urbansynapse_project.zip)

FRONTEND :
    cd frontend
    npm run dev

ESSAYE :
1. Analyse territoriale → coche "Communes (population réelle)" → les communes
   d'Alger apparaissent avec leur population réelle (clic pour le détail).
2. Menu Documents → tes 10 documents sont consultables (clic → aperçu intégré).

Vérifié : 31 communes affichées, 10 documents chargés, build OK, 3 tests backend OK.

NOTE DÉPLOIEMENT : les documents sont stockés en base. Sur Railway avec
PostgreSQL ils seront conservés. Les 31 Mo augmentent la taille de la base.
