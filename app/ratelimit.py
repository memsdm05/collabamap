from uuid import UUID, uuid4
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException, status

PERIOD = timedelta(seconds=20)
users: dict[str, datetime] = {}  # Changed UUID to str to match cookie value type

async def ratelimit(request: Request, response: Response):
    user_id = request.cookies.get("user_id")
    if not user_id:
        user_id = str(uuid4())
        response.set_cookie(key="user_id", value=user_id)
    
    now = datetime.now()
    lockout = users.get(user_id)
    
    if lockout and now < lockout:
        raise HTTPException( 
            status_code=status.HTTP_423_LOCKED,  
            detail="Rate limit exceeded. Please try again later."
        )
    
    # Update or set the lockout time
    users[user_id] = now + PERIOD
    
    return True