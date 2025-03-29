from fastapi import APIRouter, HTTPException
from typing import List

from models import Event

api = APIRouter(
    prefix="/api",
    tags=["api"],
)

@api.get("/events", response_model=List[Event])
async def get_events():
    """
    Get all events.
    """
    try:
        events = await Event.find_all().to_list()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving events: {str(e)}")

@api.post("/events", response_model=Event)
async def create_event(event: Event):
    """
    Create a new event.
    """
    try:
        await event.insert()
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating event: {str(e)}")

@api.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    """
    Get a specific event by ID.
    """
    try:
        event = await Event.get(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving event: {str(e)}")