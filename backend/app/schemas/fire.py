from typing import List, Optional
from pydantic import BaseModel


class FireDetection(BaseModel):
    """Un point de détection thermique (hotspot) issu de NASA FIRMS."""
    latitude: float
    longitude: float
    acq_date: str
    acq_time: str
    satellite: Optional[str] = None
    instrument: Optional[str] = None
    confidence: Optional[str] = None       # "l"/"n"/"h" (VIIRS) ou 0-100 (MODIS)
    frp: Optional[float] = None            # Fire Radiative Power (MW) — intensité
    daynight: Optional[str] = None         # "D" jour / "N" nuit


class FireSummary(BaseModel):
    """Synthèse du risque incendie temps réel pour un territoire."""
    territory_id: int
    territory_name: str
    risk_level: str                        # Faible / Modéré / Élevé / Critique / Indisponible
    active_count: int
    max_frp: Optional[float] = None
    bbox: List[float]                      # [west, south, east, north]
    day_range: int
    source: str
    last_updated: Optional[str] = None     # ISO 8601, heure de la requête FIRMS
    is_live: bool                          # False si clé API absente / erreur amont
    message: Optional[str] = None          # erreur ou avertissement lisible
    source_url: str                        # lien vers la carte FIRMS officielle
    fires: List[FireDetection] = []
