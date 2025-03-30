from fastapi import APIRouter, Depends, HTTPException, status

from app.models import Report, Event
from app.schemas import Point
from app.deps import get_point, get_score, get_event_within

from app.consts import *

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)

@router.post("", response_model=Report)
async def create_report(
    score: int = Depends(get_score),
    point: Point = Depends(get_point),
    event: Event | None = Depends(get_event_within)
):
    """
    Create a new report.
    """

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    report = Report(
        location=point,
        score=score
    )

    event.reports.append(report)
    
    await report.save()
    await event.save()
    return report