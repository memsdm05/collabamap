from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.models import Event
from app.schemas import EventCreate, Point
from app.deps import get_coordinates, get_point
from beanie.odm.operators.find.geospatial import NearSphere

from app.consts import *

router = APIRouter(
    prefix="/events",
    tags=["events"],
)

@router.get("", response_model=List[Event])
async def get_events(coords: tuple[float, float] = Depends(get_coordinates)):
    """
    Get all events within radius.
    """
    events = await Event.find(
        NearSphere(Event.location, *coords, max_distance=MAX_RADIUS)
    ).to_list()
    return events

@router.post("", response_model=Event)
async def create_event(
    params: EventCreate,
    point: Point = Depends(get_point)
):
    """
    Create a new event.
    """
    event = Event(
        title=params.title,
        description=params.description,
        location=point,
    )
    if params.category:
        event.category = params.category
    if params.start_time:
        event.started_at = params.start_time
    if params.end_time:
        event.ended_at = params.end_time
    
    await event.save()
    return event

@router.get("/{event_id}", response_model=Event)
async def get_event(event_id: str):
    """
    Get a specific event by ID.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
    
@router.get("/within", response_model=Event)
async def get_event_within(coords: Point = Depends(get_coordinates)):
    """
    Check to see if lat long is within event.
    """
    event = await Event.find_one(
        NearSphere(Event.geo, *coords, min_distance=EVENT_RADIUS)
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
    
@router.delete("/{event_id}", response_model=dict)
async def delete_event(event_id: str):
    """
    Delete a specific event by ID.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await event.delete()
    return {"message": f"Event {event_id} deleted successfully"}