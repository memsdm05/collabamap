from fastapi import Depends, Query, status
from typing import Tuple
from fastapi import HTTPException
from .schemas import Point


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
