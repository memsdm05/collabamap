from fastapi import APIRouter, HTTPException, Depends
from typing import List

from .models import Event
from .schemas import EventCreate, Point
from .deps import get_coordinates, get_point

from beanie.odm.operators.find.geospatial import Near

api = APIRouter(
    prefix="/api",
    tags=["api"],
)

MAX_RADIUS = 10000

@api.get("/events", response_model=List[Event])
async def get_events(coords: tuple[float, float] = Depends(get_coordinates)):
    """
    Get all events within radius.
    """
    try:
        # Get events within 5000 meters (5km) of the provided coordinates
        events = await Event.find(
            Near(Event.location, coords[0], coords[1], max_distance=5000)
        ).to_list()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving events: {str(e)}")

@api.post("/events", response_model=Event)
async def create_event(
    params: EventCreate,
    coords: Point = Depends(get_point)
):
    """
    Create a new event.
    """
    try:
        event = Event(
            title=params.title,
            description=params.description,
            location=coords
        )
        await event.save()
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating event: {str(e)}")

@api.get("/events/{event_id}", response_model=list[Event])
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
    
@api.get("/events/within")
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

