from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class BigFiveTraits(BaseModel):
    openness: float = Field(default=5.0, ge=0, le=10)
    conscientiousness: float = Field(default=5.0, ge=0, le=10)
    extraversion: float = Field(default=5.0, ge=0, le=10)
    agreeableness: float = Field(default=5.0, ge=0, le=10)
    neuroticism: float = Field(default=5.0, ge=0, le=10)

class User(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    username: str
    email: str
    hashed_password: str
    traits: BigFiveTraits = Field(default_factory=BigFiveTraits)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    traits: Optional[BigFiveTraits] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    traits: BigFiveTraits
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None