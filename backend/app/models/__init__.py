"""Import centralisé de tous les modèles ORM.

Garantit que toutes les tables (et leurs clés étrangères) sont chargées
dans le même metadata, quel que soit l'ordre d'import dans les endpoints.
"""
from app.models.territory import Territory, Zone, Building  # noqa
from app.models.indicator import Indicator, Scenario        # noqa
from app.models.user import User                            # noqa

__all__ = ["Territory", "Zone", "Building", "Indicator", "Scenario", "User"]
