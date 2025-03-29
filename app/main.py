from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import api
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles



from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models import Event
import os


load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient('mongodb://collabamap:collabamap@localhost:27017')
    
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

# Include the API router
app.include_router(api)

app.mount(
    "/",
    StaticFiles(directory="frontend/dist", html=True)
)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
