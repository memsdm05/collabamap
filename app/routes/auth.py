from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
from fastapi import APIRouter, Response
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
    token = await oauth.auth0.authorize_access_token(request)
    user = token.get('userinfo')
    request.session['user'] = dict(user)
    print(dict(user))
    return RedirectResponse(url=request.query_params.get('next', '/'))

@router.get("/logout")
async def logout(request: Request):
    request.session.pop("user", None)
    return Response(
        url=f"https://{os.environ.get('AUTH0_DOMAIN')}/v2/logout?"
        f"client_id={os.environ.get('AUTH0_CLIENT_ID')}&"
        f"returnTo={request.url_for('homepage')}"
    )