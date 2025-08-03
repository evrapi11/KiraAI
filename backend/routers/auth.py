from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from models.user import UserCreate, UserResponse, Token, User
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from database import get_database
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
ACCESS_TOKEN_EXPIRE_MINUTES = 30

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    db = get_database()
    
    existing_user = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "traits": user.traits.dict() if user.traits else {
            "openness": 5.0,
            "conscientiousness": 5.0,
            "extraversion": 5.0,
            "agreeableness": 5.0,
            "neuroticism": 5.0
        }
    }
    
    result = await db.users.insert_one(user_doc)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    return UserResponse(
        id=str(created_user["_id"]),
        username=created_user["username"],
        email=created_user["email"],
        traits=created_user["traits"],
        created_at=created_user.get("created_at")
    )

@router.post("/login", response_model=Token)
async def login(username: str, password: str):
    db = get_database()
    user = await db.users.find_one({"username": username})
    
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        traits=current_user.traits,
        created_at=current_user.created_at
    )