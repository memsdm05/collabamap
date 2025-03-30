from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
from fastapi import APIRouter, Depends, HTTPException
from starlette.requests import Request
import logging
import os


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
    request.session['target_path'] = target_path
    
    redirect_uri = request.url_for("auth")
    return await oauth.auth0.authorize_redirect(request, redirect_uri)

@router.get("")
async def auth(request: Request):
    try:
        token = await oauth.auth0.authorize_access_token(request)
        user = token.get("userinfo")
        if user:
            request.session["user"] = dict(user)
        return RedirectResponse(url="/")
    except Exception as e:
        logging.error(f"Authentication error: {str(e)}")
        return RedirectResponse(url="/")

@router.get("/logout")
async def logout(request: Request):
    request.session.pop("user", None)
    return RedirectResponse(
        url=f"https://{os.environ.get('AUTH0_DOMAIN')}/v2/logout?"
        f"client_id={os.environ.get('AUTH0_CLIENT_ID')}&"
        f"returnTo={request.url_for('homepage')}"
    )