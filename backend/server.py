from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


class TodoBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=1000)
    due_date: Optional[str] = None
    priority: str = Field(default="medium")
    status: str = Field(default="pending")


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=1000)
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class Todo(TodoBase):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


def _coerce_datetime(value: Optional[str]) -> Optional[datetime]:
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return value


def _serialize_todo(todo: Dict) -> Dict:
    if "created_at" in todo:
        todo["created_at"] = _coerce_datetime(todo.get("created_at"))
    if "updated_at" in todo:
        todo["updated_at"] = _coerce_datetime(todo.get("updated_at"))
    return todo


@api_router.get("/")
async def root():
    return {"message": "Todo API ready"}


@api_router.post("/todos", response_model=Todo)
async def create_todo(input: TodoCreate):
    todo_obj = Todo(**input.model_dump())
    doc = todo_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = None
    await db.todos.insert_one(doc)
    return todo_obj


@api_router.get("/todos", response_model=List[Todo])
async def get_todos(
    status: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
):
    query: Dict = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    todos = await db.todos.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [_serialize_todo(todo) for todo in todos]


@api_router.get("/todos/summary")
async def get_todo_summary():
    todos = await db.todos.find({}, {"_id": 0}).to_list(1000)
    summary = {
        "total": len(todos),
        "completed": 0,
        "pending": 0,
        "in_progress": 0,
        "high_priority": 0,
        "medium_priority": 0,
        "low_priority": 0,
    }
    for todo in todos:
        status = todo.get("status", "pending")
        if status == "completed":
            summary["completed"] += 1
        elif status == "in-progress":
            summary["in_progress"] += 1
        else:
            summary["pending"] += 1

        priority = todo.get("priority", "medium")
        if priority in ["high", "medium", "low"]:
            summary[f"{priority}_priority"] += 1
    return summary


@api_router.get("/todos/{todo_id}", response_model=Todo)
async def get_todo(todo_id: str):
    todo = await db.todos.find_one({"id": todo_id}, {"_id": 0})
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return _serialize_todo(todo)


@api_router.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: str, input: TodoUpdate):
    todo = await db.todos.find_one({"id": todo_id}, {"_id": 0})
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.todos.update_one({"id": todo_id}, {"$set": update_data})
    updated = await db.todos.find_one({"id": todo_id}, {"_id": 0})
    return _serialize_todo(updated)


@api_router.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str):
    result = await db.todos.delete_one({"id": todo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Todo deleted"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()