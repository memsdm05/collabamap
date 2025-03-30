from typing import Optional, Tuple
from pydantic import BaseModel
from datetime import datetime

class Point(BaseModel):
    type: str = "Point"
    coordinates: Tuple[float, float]


class EventCreate(BaseModel):
    """
    Schema for creating a new event.
    """
    title: str
    description: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    category: Optional[str] = None

class Config(BaseModel):
    max_radius: float
    event_creation_radius: float
    event_radius: float
    maps_api_key: str