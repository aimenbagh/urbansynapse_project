"""Intégration NASA FIRMS (Fire Information for Resource Management System).

Interroge l'API "Area" de FIRMS en mode "world" (une seule requête couvrant
la planète entière, comme dans la console FIRMS officielle) pour récupérer
toutes les détections actives de feux (hotspots) VIIRS en quasi temps réel,
puis filtre localement sur la zone de chaque territoire/site. Cela évite
une requête FIRMS par territoire (et donc de consommer le quota de la clé
API plus vite) tout en donnant à CHAQUE site une vraie couverture mondiale.

Référence carte officielle : https://firms.modaps.eosdis.nasa.gov/map/
Référence API : https://firms.modaps.eosdis.nasa.gov/api/area/
"""
import csv
import io
import time
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.core.config import settings

FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
FIRMS_MAP_URL = "https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@{lon},{lat},{zoom}z"
FIRMS_WORLD_AREA = "world"

# Cache mémoire simple {cache_key: (timestamp_epoch, payload_dict)}
_cache: dict[str, tuple[float, dict]] = {}


def _bbox_for(lat: float, lon: float, buffer_deg: float) -> list[float]:
    """Renvoie [west, south, east, north] autour d'un centre."""
    return [
        round(lon - buffer_deg, 4),
        round(lat - buffer_deg, 4),
        round(lon + buffer_deg, 4),
        round(lat + buffer_deg, 4),
    ]


def _in_bbox(row: dict, bbox: list[float]) -> bool:
    west, south, east, north = bbox
    return south <= row["latitude"] <= north and west <= row["longitude"] <= east


def _risk_level(count: int, max_frp: Optional[float]) -> str:
    """Détermine un niveau de risque lisible à partir du nombre de foyers actifs
    détectés dans la zone et de la puissance radiative maximale (FRP, en MW)."""
    if count == 0:
        return "Faible"
    if count >= 10 or (max_frp or 0) >= 150:
        return "Critique"
    if count >= 4 or (max_frp or 0) >= 50:
        return "Élevé"
    return "Modéré"


def _parse_csv(text: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for row in reader:
        try:
            rows.append({
                "latitude": float(row.get("latitude", 0) or 0),
                "longitude": float(row.get("longitude", 0) or 0),
                "acq_date": row.get("acq_date", ""),
                "acq_time": row.get("acq_time", ""),
                "satellite": row.get("satellite"),
                "instrument": row.get("instrument"),
                "confidence": row.get("confidence"),
                "frp": float(row["frp"]) if row.get("frp") not in (None, "") else None,
                "daynight": row.get("daynight"),
            })
        except (ValueError, TypeError):
            continue
    return rows


def _fetch_world_raw(day_range: int, force_refresh: bool = False) -> dict:
    """Récupère TOUTES les détections actives FIRMS dans le monde (area=world),
    en une seule requête mise en cache et partagée par tous les territoires/sites.

    Renvoie {"is_live", "last_updated", "message", "rows": [...]}.
    """
    source = settings.FIRMS_SOURCE
    cache_key = f"world:{source}:{day_range}"
    now = time.time()

    if not force_refresh and cache_key in _cache:
        ts, payload = _cache[cache_key]
        if now - ts < settings.FIRMS_CACHE_TTL_SECONDS:
            return payload

    if not settings.FIRMS_MAP_KEY:
        payload = {
            "is_live": False, "last_updated": None,
            "message": "Clé NASA FIRMS (FIRMS_MAP_KEY) non configurée sur le serveur.",
            "rows": [],
        }
        _cache[cache_key] = (now, payload)
        return payload

    url = f"{FIRMS_BASE_URL}/{settings.FIRMS_MAP_KEY}/{source}/{FIRMS_WORLD_AREA}/{day_range}"

    try:
        resp = httpx.get(url, timeout=30)
        resp.raise_for_status()
        text = resp.text.strip()
        # FIRMS renvoie un message texte simple (pas de CSV) en cas de clé
        # invalide ou de quota dépassé.
        if not text or text.lower().startswith(("invalid", "error")) or "latitude" not in text.splitlines()[0]:
            payload = {
                "is_live": False, "last_updated": datetime.now(timezone.utc).isoformat(),
                "message": f"Réponse FIRMS inattendue : {text[:200]}", "rows": [],
            }
            _cache[cache_key] = (now, payload)
            return payload

        rows = _parse_csv(text)
        payload = {
            "is_live": True, "last_updated": datetime.now(timezone.utc).isoformat(),
            "message": None, "rows": rows,
        }
        _cache[cache_key] = (now, payload)
        return payload

    except httpx.HTTPStatusError as exc:
        message = f"Erreur HTTP FIRMS ({exc.response.status_code})."
    except httpx.RequestError:
        message = "Impossible de contacter le service NASA FIRMS (réseau)."
    except Exception:  # sécurité : ne jamais faire planter la page d'analyse
        message = "Erreur inattendue lors de la récupération des données FIRMS."

    # En cas d'échec réseau, on retombe sur un cache expiré s'il existe
    # (mieux qu'une absence totale de donnée), sinon un résultat vide explicite.
    if cache_key in _cache:
        _, stale = _cache[cache_key]
        return {**stale, "message": f"{message} Dernière donnée connue affichée."}

    return {"is_live": False, "last_updated": None, "message": message, "rows": []}


def fetch_active_fires(
    lat: float,
    lon: float,
    territory_id: int = 0,
    territory_name: str = "",
    buffer_deg: Optional[float] = None,
    day_range: Optional[int] = None,
    force_refresh: bool = False,
) -> dict:
    """Récupère les foyers actifs NASA FIRMS autour d'un point.

    Interroge désormais la couverture MONDIALE (area=world) — une seule requête
    FIRMS partagée par tous les territoires/sites — puis filtre localement sur
    la zone tampon du territoire demandé. Ainsi chaque site (Alger, Oran, etc.)
    bénéficie de la même donnée mondiale temps réel, sans multiplier les appels
    à l'API (et donc sans épuiser plus vite le quota de la clé FIRMS).

    Renvoie un dict compatible avec le schéma FireSummary. Si aucune clé API
    n'est configurée (FIRMS_MAP_KEY) ou en cas d'erreur réseau, renvoie un
    résultat "is_live: False" avec un message explicite plutôt que de planter
    la page.
    """
    buffer_deg = buffer_deg or settings.FIRMS_BBOX_BUFFER_DEG
    day_range = day_range or settings.FIRMS_DAY_RANGE
    bbox = _bbox_for(lat, lon, buffer_deg)
    source = settings.FIRMS_SOURCE
    source_url = FIRMS_MAP_URL.format(lon=round(lon, 2), lat=round(lat, 2), zoom=9)

    world = _fetch_world_raw(day_range, force_refresh=force_refresh)
    rows = [r for r in world["rows"] if _in_bbox(r, bbox)]
    max_frp = max((r["frp"] for r in rows if r["frp"] is not None), default=None)

    return {
        "territory_id": territory_id, "territory_name": territory_name,
        "risk_level": _risk_level(len(rows), max_frp) if world["is_live"] else "Indisponible",
        "active_count": len(rows), "max_frp": max_frp,
        "bbox": bbox, "day_range": day_range, "source": source,
        "last_updated": world["last_updated"], "is_live": world["is_live"],
        "message": world["message"], "source_url": source_url, "fires": rows,
    }


def fetch_world_fires(day_range: Optional[int] = None, force_refresh: bool = False) -> dict:
    """Renvoie TOUTES les détections actives dans le monde, sans filtrage par
    site — utile pour une vue globale (ex. couche carte "Feux dans le monde")."""
    day_range = day_range or settings.FIRMS_DAY_RANGE
    world = _fetch_world_raw(day_range, force_refresh=force_refresh)
    rows = world["rows"]
    max_frp = max((r["frp"] for r in rows if r["frp"] is not None), default=None)
    return {
        "territory_id": 0, "territory_name": "Monde",
        "risk_level": _risk_level(len(rows), max_frp) if world["is_live"] else "Indisponible",
        "active_count": len(rows), "max_frp": max_frp,
        "bbox": [-180.0, -90.0, 180.0, 90.0], "day_range": day_range,
        "source": settings.FIRMS_SOURCE,
        "last_updated": world["last_updated"], "is_live": world["is_live"],
        "message": world["message"],
        "source_url": "https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs",
        "fires": rows,
    }
