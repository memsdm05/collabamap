from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.models import Event, Report
from app.schemas import EventCreate, Point, ScoreReturn
from app.deps import get_coordinates, get_point, get_event_within, get_score
from app.consts import *

from beanie.odm.operators.find.geospatial import NearSphere


router = APIRouter(
    prefix="/events",
    tags=["events"],
)

async def find_event(event_id: str) -> Event:
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

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
    report = Report(
        location=point,
        score=3
    )

    event = Event(
        title=params.title,
        description=params.description,
        location=point,
        reports=[report]
    )
    if params.category:
        event.category = params.category
    if params.start_time:
        event.started_at = params.start_time
    if params.end_time:
        event.ended_at = params.end_time
    
    await report.save()
    await event.save()
    return event

@router.get("/{event_id}", response_model=Event)
async def get_event(event: Event = Depends(find_event)):
    """
    Get a specific event by ID.
    """
    return event
    


@router.get("/within", response_model=Event)
async def get_event_within_endpoint(event: Event = Depends(get_event_within)):
    """
    Check to see if lat long is within event.
    """
    return event
    
@router.delete("/{event_id}", response_model=dict)
async def delete_event(event: Event = Depends(find_event)):
    """
    Delete a specific event by ID.
    """
    
    await event.delete()
    return {"message": f"Event {event._id} deleted successfully"}

@router.get("/{event_id}/score")
async def get_weighted_score(event: Event = Depends(find_event)) -> ScoreReturn:
    score = await event.get_weighted_score()
    return ScoreReturn(score=score)

@router.get("/{event_id}/reports", response_model=List[Report])
async def get_event_reports(event: Event = Depends(find_event)):
    """
    Get all reports associated with a specific event.
    """
    # Fetch all reports linked to this event
    await event.fetch_all_links()
    return event.reports

@router.post("/{event_id}/reports", response_model=Report)
async def create_event_report(
    event: Event = Depends(find_event),
    score: int = Depends(get_score),
    point: Point = Depends(get_point)
):
    """
    Create a new report for a specific event by ID.
    """

    report = Report(
        location=point,
        score=score
    )

    event.reports.append(report)
    
    await report.save()
    await event.save()
    return report
