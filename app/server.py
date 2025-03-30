import logging
import os
from contextlib import asynccontextmanager

from beanie import init_beanie
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from app.models import Event, Report
from app.routes.api import config, events, reports
from app.routes import auth


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Log to console
    ]
)

logger = logging.getLogger(__name__)
logger.info("Starting CollabaMap API server")

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(os.environ["MONGODB_URI"])
    
    # Initialize Beanie with the MongoDB client and document models
    await init_beanie(
        database=client.collabamap,
        document_models=[Event, Report]
    )
    
    print("Connected to MongoDB and initialized Beanie ODM")

    yield


app = FastAPI(
    title="CollabaMap API",
    description="API for collaborative mapping application",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Add custom middleware
@app.middleware("http")
async def exception_handling_middleware(request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logging.error(f"Unhandled exception: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "message": str(e)
            }
        )

# @app.middleware("http")
# async def check_session_middleware(request: Request, call_next):
#     print(request.session)
#     user = request.session.get("user")
#     if not user and not request.url.path.startswith("/auth/login"):
#         if request.url.path.startswith("/api"):
#             return JSONResponse(
#                 status_code=401,
#                 content={"detail": "Not authenticated"}
#             )
#         else:
#             return RedirectResponse(url="/auth/login", status_code=303)
#     return await call_next(request)

# Add API routers
api_router = APIRouter(prefix="/api")
api_router.include_router(config.router)
api_router.include_router(events.router)
api_router.include_router(reports.router)

app.include_router(auth.router)
app.include_router(api_router)

# Mount static files last
app.mount(
    "/",
    StaticFiles(directory="frontend/dist", html=True)
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)