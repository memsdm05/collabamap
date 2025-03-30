from typing import Optional, Annotated
from pydantic import BaseModel
from beanie import Document, Indexed
import pymongo
from .schemas import Point
from datetime import datetime


class Event(Document):
    title: str
    location: Annotated[Point, Indexed(index_type=pymongo.GEOSPHERE)]
    description: str = "This is a new description"
    category: str = "Generic"

    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


    @property
    def created_at(self) -> Optional[str]:
        """
        Returns the creation timestamp from the document's _id field.
        
        The MongoDB ObjectId contains a timestamp in its first 4 bytes.
        """
        if hasattr(self, "id") and self.id:
            # Extract creation time from the ObjectId
            return self.id.generation_time
        return None
    
    class Settings:
        name = "events"
        use_state_management = True
        validate_on_save = True
        indexes = [("location", pymongo.GEOSPHERE)]
    