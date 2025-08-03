from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from models.user import PyObjectId

class StrategicPlan(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    title: str
    analysis: str
    recommendations: List[str]
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    based_on_entries: List[PyObjectId] = Field(default_factory=list)
    zen_insight: str = ""

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class StrategicPlanResponse(BaseModel):
    id: str
    title: str
    analysis: str
    recommendations: List[str]
    generated_at: datetime
    zen_insight: str