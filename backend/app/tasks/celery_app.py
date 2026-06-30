from celery import Celery
from app.core.config import settings

celery_app = Celery("urbansynapse", broker=settings.CELERY_BROKER_URL,
                    backend=settings.CELERY_RESULT_BACKEND)


@celery_app.task
def run_heavy_simulation(scenario_id: int) -> dict:
    """Placeholder for long-running territorial simulations."""
    return {"scenario_id": scenario_id, "status": "completed"}
