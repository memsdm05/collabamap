from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
from fastapi import APIRouter, HTTPException
from jose import jwt
import os
from datetime import datetime, timedelta

from app.consts import *

# Configure Auth0
oauth = OAuth()
oauth.register(
    "auth0",
    client_id=os.environ.get("AUTH0_CLIENT_ID"),
    client_secret=os.environ.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{os.environ.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

# Create auth router
router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

# Auth routes
@router.get("/login")
async def login(request: Request):
    # Save the intended target path from query params or referrer
    target_path = request.query_params.get('next', '/')
    
    redirect_uri = request.url_for("auth")
    return await oauth.auth0.authorize_redirect(request, redirect_uri)

@router.get("")
async def auth(request: Request):
    token = await oauth.auth0.authorize_access_token(request)
    user = token.get('userinfo')
    
    # Create JWT token
    access_token = create_access_token(dict(user))
    
    # Create response with redirect
    response = RedirectResponse(url=request.query_params.get('next', '/'))
    
    # Set JWT token in HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # Only send cookie over HTTPS
        samesite="lax",  # Protect against CSRF
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    )
    
    return response

@router.get("/logout")
async def logout(request: Request):
    response = RedirectResponse(
        url=f"https://{os.environ.get('AUTH0_DOMAIN')}/v2/logout?"
        f"client_id={os.environ.get('AUTH0_CLIENT_ID')}&"
        f"returnTo={request.url_for('homepage')}"
    )
    
    # Clear the JWT cookie
    response.delete_cookie(key="access_token")
    
    return response

@router.get("/me")
async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")