# Changements — Feux actifs temps réel (NASA FIRMS) + correctifs Notifications

## 1. Page "Analyse territoriale" — données incendie réelles

Auparavant, le risque "Feu de forêt" était une valeur **fixe** ("Faible") codée en
dur côté frontend, identique pour tous les territoires. Il est remplacé par une
**vraie donnée temps réel** issue de NASA FIRMS (la même source que
https://firms.modaps.eosdis.nasa.gov/map/), calculée pour chaque territoire.

### Backend
- `app/core/config.py` : nouvelles variables `FIRMS_MAP_KEY`, `FIRMS_SOURCE`,
  `FIRMS_DAY_RANGE`, `FIRMS_BBOX_BUFFER_DEG`, `FIRMS_CACHE_TTL_SECONDS`.
- `app/services/firms_service.py` (nouveau) : interroge l'API Area de FIRMS
  (capteur VIIRS_SNPP_NRT, fenêtre 24h par défaut) sur une zone tampon autour
  du centre du territoire, calcule un niveau de risque (Faible/Modéré/Élevé/
  Critique) à partir du nombre de foyers actifs et de la puissance radiative
  (FRP), avec cache 10 min et gestion d'erreurs robuste (jamais de crash :
  sans clé API ou en cas de panne réseau → `is_live: false` + message clair).
- `app/schemas/fire.py` (nouveau) : schémas `FireDetection` / `FireSummary`.
- `GET /api/v1/territories/{id}/fires` (nouveau) : synthèse JSON du risque.
- `GET /api/v1/layers/{id}/fires` (nouveau) : mêmes données en GeoJSON pour
  affichage sur la carte.
- `.env` / `.env.example` : ajout de `FIRMS_MAP_KEY` (à renseigner avec une
  clé gratuite : https://firms.modaps.eosdis.nasa.gov/api/area/).

**Important** : sans `FIRMS_MAP_KEY` configurée sur le serveur, l'indicateur
affiche honnêtement "Indisponible" plutôt que d'inventer une valeur — c'est
volontaire (pas de fausses données).

### Frontend
- `src/api/fires.ts` (nouveau), `src/api/layers.ts` : appels vers les 2
  nouveaux endpoints.
- `src/pages/TerritorialAnalysisPage.tsx` : le panneau "Analyse des risques"
  affiche désormais le niveau réel, le nombre de foyers actifs, la puissance
  radiative max, l'heure de dernière mise à jour, un bouton de rafraîchissement
  manuel, et un lien direct vers la carte FIRMS officielle. Rafraîchissement
  automatique toutes les 5 minutes.
- `src/components/map/TerritoryMap.tsx` : nouvelle couche activable
  "Feux actifs (NASA FIRMS)" affichant les foyers détectés sous forme de
  points colorés (par confiance) et dimensionnés (par puissance radiative),
  avec popup au clic (date, heure, satellite, confiance, FRP).
- `src/components/map/MapLegend.tsx` : entrée de légende ajoutée.

## 2. Notifications — corrections

Le système de notifications était entièrement statique et présentait
plusieurs bugs réels :
- La liste (3 éléments) était codée en dur, identique pour tous les
  territoires/utilisateurs, jamais persistée.
- Les horodatages ("Il y a 25 min") étaient des textes figés qui restaient
  faux indéfiniment.
- Le badge rouge s'affichait toujours, sans lien avec un état "lu/non lu".
- Cliquer sur une notification ne faisait rien.
- Le bouton "Notifications" dans Paramètres ne contrôlait rien (état local
  perdu au rechargement, sans effet sur la cloche du Topbar).

### Corrections apportées
- `src/store/useNotificationsStore.ts` (nouveau) : store persistant
  (localStorage) avec vrai statut lu/non lu, `markRead`, `markAllRead`,
  `setEnabled`.
- `src/utils/time.ts` (nouveau) : `timeAgo()` recalculé à l'affichage à partir
  d'une date ISO réelle (au lieu d'un texte figé).
- `src/hooks/useFireAlerts.ts` (nouveau) : génère une **vraie** notification
  quand le risque incendie temps réel (FIRMS) du territoire actif est
  Élevé/Critique — plus de contenu simulé.
- `src/components/layout/Topbar.tsx` : branché sur le store (badge = nombre
  réel de non-lus, clic = marque comme lu + navigue vers l'analyse
  territoriale si pertinent, bouton "tout marquer comme lu", état "désactivé"
  affiché si les notifications sont coupées dans les Paramètres).
- `src/pages/SettingsPage.tsx` : le switch "Notifications" pilote désormais
  réellement le store (au lieu d'un `useState` local sans effet).

## Vérifications effectuées
- `tsc --noEmit` : aucune erreur.
- `npm run build` (Vite) : build de production réussi.
- Backend : chargement de l'app FastAPI, routes `/api/v1/territories/{id}/fires`
  et `/api/v1/layers/{id}/fires` confirmées enregistrées, testées avec
  `TestClient` sur la base SQLite existante — comportement "Indisponible" sans
  clé, et comportement "Critique" simulé avec une clé + réponse FIRMS factice.
