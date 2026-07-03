# Couches thématiques + bâtiments au-dessus de la carte + bouton Profil

═══════════════════════════════════════════════════════════════
## 1. BÂTIMENTS + COUCHES THÉMATIQUES VISIBLES EN 2D
═══════════════════════════════════════════════════════════════
Les zones s'affichaient déjà, mais pas les bâtiments ni les couches
thématiques (risques, mobilité, socio, communes) : elles chargent APRÈS et
repassaient sous le fond de carte.

Correction : un mécanisme REMONTE EN CONTINU nos couches au-dessus du fond
(écouteurs "idle" et "sourcedata" de la carte). Dès qu'une couche apparaît,
elle est replacée au sommet. Résultat : bâtiments (A-G), risques, mobilité,
socio et communes s'affichent tous en 2D.

═══════════════════════════════════════════════════════════════
## 2. BOUTON "VOIR LE PROFIL COMPLET"
═══════════════════════════════════════════════════════════════
Un bouton "Voir le profil complet" est ajouté en haut de la page Analyse
territoriale. Il ouvre la page Profil de la wilaya active (Profil — Alger :
performance, risques détaillés, radar, analyse combinée).

═══════════════════════════════════════════════════════════════
## FICHIERS
═══════════════════════════════════════════════════════════════
- `frontend/src/components/map/TerritoryMap.tsx` — couches remontées en continu
- `frontend/src/pages/TerritorialAnalysisPage.tsx` — bouton Profil

═══════════════════════════════════════════════════════════════
## APRÈS COPIE (frontend uniquement)
═══════════════════════════════════════════════════════════════
    cd frontend
    npm run dev

ESSAYE :
- Analyse territoriale, 2D → active "Bâti existant", "Risques naturels",
  "Mobilité"... → tout s'affiche maintenant sur la carte.
- Clique "Voir le profil complet" (en haut à droite) → page Profil de la wilaya.

Vérifié : build OK.
