"""Intégration NASA FIRMS (Fire Information for Resource Management System).

Interroge l'API "Area" de FIRMS pour récupérer les détections actives de
feux (hotspots) VIIRS/MODIS en quasi temps réel sur une zone géographique,
et calcule un niveau de risque "Feu de forêt" pour un territoire.

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


def fetch_active_fires(
    lat: float,
    lon: float,
    territory_id: int = 0,
    territory_name: str = "",
    buffer_deg: Optional[float] = None,
    day_range: Optional[int] = None,
    force_refresh: bool = False,
) -> dict:
    """Récupère les foyers actifs NASA FIRMS autour d'un point, avec cache court.

    Renvoie un dict compatible avec le schéma FireSummary. Si aucune clé API
    n'est configurée (FIRMS_MAP_KEY) ou en cas d'erreur réseau, renvoie un
    résultat "is_live: False" avec un message explicite plutôt que de planter
    la page — la donnée réelle est prioritaire, mais l'absence de clé ne doit
    pas casser l'analyse territoriale.
    """
    buffer_deg = buffer_deg or settings.FIRMS_BBOX_BUFFER_DEG
    day_range = day_range or settings.FIRMS_DAY_RANGE
    bbox = _bbox_for(lat, lon, buffer_deg)
    source = settings.FIRMS_SOURCE
    source_url = FIRMS_MAP_URL.format(lon=round(lon, 2), lat=round(lat, 2), zoom=9)

    cache_key = f"{source}:{bbox}:{day_range}"
    now = time.time()
    if not force_refresh and cache_key in _cache:
        ts, payload = _cache[cache_key]
        if now - ts < settings.FIRMS_CACHE_TTL_SECONDS:
            return {**payload, "territory_id": territory_id, "territory_name": territory_name}

    if not settings.FIRMS_MAP_KEY:
        payload = {
            "territory_id": territory_id, "territory_name": territory_name,
            "risk_level": "Indisponible", "active_count": 0, "max_frp": None,
            "bbox": bbox, "day_range": day_range, "source": source,
            "last_updated": None, "is_live": False,
            "message": "Clé NASA FIRMS (FIRMS_MAP_KEY) non configurée sur le serveur.",
            "source_url": source_url, "fires": [],
        }
        _cache[cache_key] = (now, payload)
        return payload

    west, south, east, north = bbox
    url = f"{FIRMS_BASE_URL}/{settings.FIRMS_MAP_KEY}/{source}/{west},{south},{east},{north}/{day_range}"

    try:
        resp = httpx.get(url, timeout=15)
        resp.raise_for_status()
        text = resp.text.strip()
        # FIRMS renvoie un message texte simple (pas de CSV) en cas de clé
        # invalide ou de quota dépassé.
        if not text or text.lower().startswith(("invalid", "error")) or "latitude" not in text.splitlines()[0]:
            payload = {
                "territory_id": territory_id, "territory_name": territory_name,
                "risk_level": "Indisponible", "active_count": 0, "max_frp": None,
                "bbox": bbox, "day_range": day_range, "source": source,
                "last_updated": datetime.now(timezone.utc).isoformat(), "is_live": False,
                "message": f"Réponse FIRMS inattendue : {text[:200]}",
                "source_url": source_url, "fires": [],
            }
            _cache[cache_key] = (now, payload)
            return payload

        rows = _parse_csv(text)
        max_frp = max((r["frp"] for r in rows if r["frp"] is not None), default=None)
        payload = {
            "territory_id": territory_id, "territory_name": territory_name,
            "risk_level": _risk_level(len(rows), max_frp),
            "active_count": len(rows), "max_frp": max_frp,
            "bbox": bbox, "day_range": day_range, "source": source,
            "last_updated": datetime.now(timezone.utc).isoformat(), "is_live": True,
            "message": None, "source_url": source_url, "fires": rows,
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
        return {**stale, "message": f"{message} Dernière donnée connue affichée.",
                "territory_id": territory_id, "territory_name": territory_name}

    return {
        "territory_id": territory_id, "territory_name": territory_name,
        "risk_level": "Indisponible", "active_count": 0, "max_frp": None,
        "bbox": bbox, "day_range": day_range, "source": source,
        "last_updated": None, "is_live": False, "message": message,
        "source_url": source_url, "fires": [],
    }
