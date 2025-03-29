from typing import Optional, Tuple
from pydantic import BaseModel
from beanie import Document


class Point(BaseModel):
    type: str = "Point"
    coordinates: Tuple[float, float]

class Event(Document):
    title: str
    location: Point
    description: str = "This is a new description"
    category: str = "Generic"
    
    class Config:        
        indexes = [
            {
                "key": [("location", "2dsphere")],
                "name": "location_2dsphere"
            }
        ]