from fastapi import APIRouter
from app.api.v1.endpoints import auth, territories, scenarios, energy, indicators, ahp, geo, reference, planning, reports, foresight, ingest, layers, profile

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(territories.router)
api_router.include_router(scenarios.router)
api_router.include_router(energy.router)
api_router.include_router(indicators.router)
api_router.include_router(ahp.router)
api_router.include_router(geo.router)
api_router.include_router(reference.router)
api_router.include_router(planning.router)
api_router.include_router(reports.router)
api_router.include_router(foresight.router)
api_router.include_router(ingest.router)
api_router.include_router(layers.router)
api_router.include_router(profile.router)
