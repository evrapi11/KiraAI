from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection
from routers import auth, journal, traits, strategic_plan
import os
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title="KiraAI API",
    description="AI-powered journal and planning application",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(journal.router, prefix="/api/journal", tags=["journal"])
app.include_router(traits.router, prefix="/api/traits", tags=["traits"])
app.include_router(strategic_plan.router, prefix="/api/strategic-plan", tags=["strategic-plan"])

@app.get("/")
async def root():
    return {"message": "Welcome to KiraAI API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)