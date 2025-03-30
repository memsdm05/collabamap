from fastapi import Depends, Query, Request, status
from typing import Tuple, Optional
from fastapi import HTTPException
from app.schemas import Point, ReportCreate
from app.models import Event
from jose import jwt, JWTError
import os

from app.consts import EVENT_RADIUS
from beanie.odm.operators.find.geospatial import NearSphere


async def get_coordinates(
    lat: float = Query(..., description="Latitude coordinate"),
    lng: float = Query(..., description="Longitude coordinate")
) -> Tuple[float, float]:
    """
    Dependency to extract and validate latitude and longitude coordinates from query parameters.

    Args:
        lat: Latitude coordinate (-90 to 90)
        lng: Longitude coordinate (-180 to 180)
        
    Returns:
        Tuple containing the latitude and longitude coordinates
        
    Raises:
        HTTPException: If coordinates are outside valid ranges
    """
    # Validate latitude range
    if lat < -90 or lat > 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90 degrees"
        )
    
    # Validate longitude range
    if lng < -180 or lng > 180:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180 degrees"
        )
    
    return lat, lng

async def get_point(coords: Tuple[float, float] = Depends(get_coordinates)):
    return Point(coordinates=list(coords))


async def get_score(create_report: ReportCreate):
    if int(create_report.score) not in (1, -1):
                raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Score must be either 1 or -1"
        )
    
    return int(create_report.score)

async def get_current_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def get_event_within(coords: tuple[float, float] = Depends(get_coordinates)) -> Optional[Event]:
    """
    Check to see if lat long is within event.
    """
    return await Event.find_one(
        NearSphere(Event.location, *coords, max_distance=EVENT_RADIUS)
    )