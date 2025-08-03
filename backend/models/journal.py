from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from models.user import PyObjectId

class JournalEntry(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    title: str
    content: str
    mood_rating: Optional[int] = Field(default=None, ge=1, le=10)
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class JournalEntryCreate(BaseModel):
    title: str
    content: str
    mood_rating: Optional[int] = Field(default=None, ge=1, le=10)
    tags: List[str] = Field(default_factory=list)

class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood_rating: Optional[int] = Field(default=None, ge=1, le=10)
    tags: Optional[List[str]] = None

class JournalEntryResponse(BaseModel):
    id: str
    title: str
    content: str
    mood_rating: Optional[int]
    tags: List[str]
    created_at: datetime
    updated_at: datetime