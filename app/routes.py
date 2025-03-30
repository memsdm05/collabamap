from fastapi import APIRouter, HTTPException, Depends
from typing import List

from .models import Event
from .schemas import EventCreate, Point, Config
from .deps import get_coordinates, get_point

from beanie.odm.operators.find.geospatial import Near

import os

api = APIRouter(
    prefix="/api",
    tags=["api"],
)

MAX_RADIUS = 3218.69 # 2mi to meters
EVENT_CREATION_RADIUS = 100
EVENT_RADIUS = 20


@api.get("/config", response_model=Config)
async def get_config():
    return Config(
        max_radius=MAX_RADIUS,
        event_creation_radius=EVENT_CREATION_RADIUS,
        event_radius=EVENT_RADIUS,
        maps_api_key=os.environ['GOOGLE_MAPS_KEY']
    )

@api.get("/events", response_model=List[Event])
async def get_events(coords: tuple[float, float] = Depends(get_coordinates)):
    """
    Get all events within radius.
    """
    try:
        events = await Event.find(
            Near(Event.location, *coords, max_distance=MAX_RADIUS)
        ).to_list()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving events: {str(e)}")

@api.post("/events", response_model=Event)
async def create_event(
    params: EventCreate,
    point: Point = Depends(get_point)
):
    """
    Create a new event.
    """
    try:
        event = Event(
            title=params.title,
            description=params.description,
            location=point
        )
        await event.save()
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
    
@api.get("/events/within", response_model=Event)
async def get_event_within(coords: Point = Depends(get_coordinates)):
    """
    Get a specific event by ID.
    """
    try:
        print(coords)
        events = await Event.find(
            Near(Event.geo, *coords, min_distance=3000)
        ).to_list()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving event: {str(e)}")
    
@api.delete("/events/{event_id}", response_model=dict)
async def delete_event(event_id: str):
    """
    Delete a specific event by ID.
    """
    try:
        event = await Event.get(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        await event.delete()
        return {"message": f"Event {event_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting event: {str(e)}")

