from fastapi import APIRouter
from app.schemas import Config
from app.routes.api import events
from beanie.odm.operators.find.geospatial import Near

from app.consts import *
import os

router = APIRouter(tags=["config"])

@router.get("/config", response_model=Config)
async def get_config():
    """
    Get application configuration settings.
    """
    config = Config(
        max_radius=MAX_RADIUS,
        event_creation_radius=EVENT_CREATION_RADIUS,
        event_radius=EVENT_RADIUS,
        maps_api_key=os.environ.get("GOOGLE_MAPS_KEY", "")
    )
    return config
