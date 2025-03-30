from typing import Optional, List
from pydantic import BaseModel
from beanie import Document, Indexed, Link
import pymongo
from .schemas import Point
from datetime import datetime


class Report(Document):
    score: int
    location: Point

    class Settings:
        name = "reports"
        use_state_management = True
        validate_on_save = True
        indexes = [("location", pymongo.GEOSPHERE)]

class Event(Document):
    title: str
    location: Point
    description: str = "This is a new description"
    category: str = "Generic"

    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    reports: List[Link[Report]] = []

    async def get_weighted_score(self) -> float:
        """
        Calculate a weighted sum of all report scores, with newer reports having higher weight.
        
        Returns:
            float: The weighted score of the event
        """
        if len(self.reports) == 0:
            return 0.0
            
        total_score = 0.0
        total_weight = 0.0
        
        await self.fetch_all_links()

        reports = self.reports.copy()

        reports.sort(key=lambda r: r.id.generation_time)

        decay_factor = 0.8
        
        for i, report in enumerate(reports):
            # Weight increases with index (newer reports have higher indices)
            weight = decay_factor ** (len(reports) - i - 1)
            total_score += report.score * weight
            total_weight += weight
        
        return total_score
    
    class Settings:
        name = "events"
        use_state_management = True
        validate_on_save = True
        json_schema_extra = {"exclude": ["reports"]}
        indexes = [("location", pymongo.GEOSPHERE)]


