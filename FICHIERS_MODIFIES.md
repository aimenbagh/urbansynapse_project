# Isolation par utilisateur (scénarios + rapports) + détail des critères

═══════════════════════════════════════════════════════════════
## 1. CHAQUE UTILISATEUR A SES PROPRES SCÉNARIOS ET RAPPORTS
═══════════════════════════════════════════════════════════════
AVANT : tous les utilisateurs voyaient les MÊMES scénarios et rapports (mélangés).
MAINTENANT : chaque utilisateur ne voit et ne gère QUE les siens.

- Un scénario/rapport appartient à son créateur (user_id).
- La liste ne montre que ceux de l'utilisateur connecté.
- On ne peut ni voir, ni supprimer ceux d'un autre (404 sinon).

Testé : admin et user créent chacun un scénario → chacun ne voit que le sien.

═══════════════════════════════════════════════════════════════
## 2. "DÉTAIL DES CRITÈRES" QUI NE S'AFFICHAIT PAS
═══════════════════════════════════════════════════════════════
Le scénario "Mobilité verte" de ta capture était un ANCIEN scénario, créé
avant que le détail des critères soit enregistré. Son message "Aucun détail"
est donc normal.
Les NOUVEAUX scénarios (créés après cette mise à jour) affichent bien les
6 critères. La recréation de la base (ci-dessous) enlève les anciens.

═══════════════════════════════════════════════════════════════
## FICHIERS
═══════════════════════════════════════════════════════════════
- `backend/app/models/indicator.py` — Scenario + user_id
- `backend/app/models/report.py` — Report + user_id
- `backend/app/api/v1/endpoints/scenarios.py` — filtre par utilisateur
- `backend/app/api/v1/endpoints/reports.py` — filtre par utilisateur

═══════════════════════════════════════════════════════════════
## APRÈS COPIE — RECRÉE LA BASE (nouvelles colonnes user_id)
═══════════════════════════════════════════════════════════════
    cd backend
    del urbansynapse.db
    .venv\Scripts\python.exe -m scripts.init_db
    .venv\Scripts\python.exe -m scripts.seed_documents   (si tu veux les documents)
    .venv\Scripts\python.exe -m uvicorn app.main:app --reload

(La recréation est nécessaire car on a ajouté la colonne user_id. Elle
supprime aussi les anciens scénarios sans détail.)

ESSAYE :
- Connecte-toi en admin → crée un scénario → clique-le → détails OK.
- Connecte-toi en user → tu ne vois PAS les scénarios de l'admin, seulement
  les tiens. Pareil pour les rapports.

Vérifié : isolation OK (chacun voit les siens), détail des critères OK sur les
nouveaux, 3 tests backend OK.
