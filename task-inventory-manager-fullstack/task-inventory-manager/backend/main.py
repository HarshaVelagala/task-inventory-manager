from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, tasks, inventory, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Task & Inventory Manager API",
    description="FastAPI backend with JWT auth, RBAC, and MongoDB for task and inventory management.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(inventory.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "task-inventory-api"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
