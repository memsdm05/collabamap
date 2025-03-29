from typing import Optional, Tuple
from pydantic import BaseModel


class Point(BaseModel):
    type: str = "Point"
    coordinates: Tuple[float, float]


class EventCreate(BaseModel):
    """
    Schema for creating a new event.
    """
    title: str
    description: str
