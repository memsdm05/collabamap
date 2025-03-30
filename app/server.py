import logging
import os
from contextlib import asynccontextmanager

from beanie import init_beanie
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.sessions import SessionMiddleware

from app.models import Event
from app.routes.api import config, events
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
        document_models=[Event]
    )
    
    print("Connected to MongoDB and initialized Beanie ODM")

    yield


app = FastAPI(
    title="CollabaMap API",
    description="API for collaborative mapping application",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Add session middleware to store user info
app.add_middleware(SessionMiddleware, secret_key=os.urandom(24))

# Add middleware to catch and handle exceptions
@app.middleware("http")
async def exception_handling_middleware(request, call_next):
    try:
        # Process the request and get the response
        response = await call_next(request)
        return response
    except Exception as e:
        # Log the exception
        logging.error(f"Unhandled exception: {str(e)}")

        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "message": str(e)
            }
        )


api_router = APIRouter(prefix="/api")
api_router.include_router(config.router)
api_router.include_router(events.router)

app.include_router(auth.router)
app.include_router(api_router)

app.mount(
    "/",
    StaticFiles(directory="frontend/dist", html=True)
)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
