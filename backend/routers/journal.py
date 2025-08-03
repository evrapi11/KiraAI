from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.journal import JournalEntry, JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
from models.user import User
from utils.auth import get_current_user
from database import get_database
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=JournalEntryResponse)
async def create_journal_entry(
    entry: JournalEntryCreate, 
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    entry_doc = {
        "user_id": current_user.id,
        "title": entry.title,
        "content": entry.content,
        "mood_rating": entry.mood_rating,
        "tags": entry.tags,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.journal_entries.insert_one(entry_doc)
    created_entry = await db.journal_entries.find_one({"_id": result.inserted_id})
    
    from utils.traits import update_traits_from_entry
    await update_traits_from_entry(current_user.id, entry.content)
    
    return JournalEntryResponse(
        id=str(created_entry["_id"]),
        title=created_entry["title"],
        content=created_entry["content"],
        mood_rating=created_entry.get("mood_rating"),
        tags=created_entry["tags"],
        created_at=created_entry["created_at"],
        updated_at=created_entry["updated_at"]
    )

@router.get("/", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    cursor = db.journal_entries.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    entries = []
    async for entry in cursor:
        entries.append(JournalEntryResponse(
            id=str(entry["_id"]),
            title=entry["title"],
            content=entry["content"],
            mood_rating=entry.get("mood_rating"),
            tags=entry["tags"],
            created_at=entry["created_at"],
            updated_at=entry["updated_at"]
        ))
    
    return entries

@router.get("/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    entry = await db.journal_entries.find_one({
        "_id": ObjectId(entry_id),
        "user_id": current_user.id
    })
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found"
        )
    
    return JournalEntryResponse(
        id=str(entry["_id"]),
        title=entry["title"],
        content=entry["content"],
        mood_rating=entry.get("mood_rating"),
        tags=entry["tags"],
        created_at=entry["created_at"],
        updated_at=entry["updated_at"]
    )

@router.put("/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(
    entry_id: str,
    entry_update: JournalEntryUpdate,
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    existing_entry = await db.journal_entries.find_one({
        "_id": ObjectId(entry_id),
        "user_id": current_user.id
    })
    
    if not existing_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found"
        )
    
    update_data = {}
    if entry_update.title is not None:
        update_data["title"] = entry_update.title
    if entry_update.content is not None:
        update_data["content"] = entry_update.content
    if entry_update.mood_rating is not None:
        update_data["mood_rating"] = entry_update.mood_rating
    if entry_update.tags is not None:
        update_data["tags"] = entry_update.tags
    
    update_data["updated_at"] = datetime.utcnow()
    
    await db.journal_entries.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": update_data}
    )
    
    updated_entry = await db.journal_entries.find_one({"_id": ObjectId(entry_id)})
    
    return JournalEntryResponse(
        id=str(updated_entry["_id"]),
        title=updated_entry["title"],
        content=updated_entry["content"],
        mood_rating=updated_entry.get("mood_rating"),
        tags=updated_entry["tags"],
        created_at=updated_entry["created_at"],
        updated_at=updated_entry["updated_at"]
    )

@router.delete("/{entry_id}")
async def delete_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    result = await db.journal_entries.delete_one({
        "_id": ObjectId(entry_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found"
        )
    
    return {"message": "Journal entry deleted successfully"}