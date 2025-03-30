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
    start_time: Optional[datetime]
    end_time: Optional[datetime]