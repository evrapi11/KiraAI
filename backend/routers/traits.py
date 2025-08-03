from fastapi import APIRouter, Depends
from models.user import User, BigFiveTraits
from utils.auth import get_current_user
from database import get_database

router = APIRouter()

@router.get("/", response_model=BigFiveTraits)
async def get_user_traits(current_user: User = Depends(get_current_user)):
    """Get current user's Big Five personality traits"""
    return current_user.traits

@router.get("/history")
async def get_traits_history(current_user: User = Depends(get_current_user)):
    """Get historical changes in user's traits over time"""
    db = get_database()
    
    # Get trait history from a separate collection that tracks changes
    cursor = db.trait_history.find(
        {"user_id": current_user.id}
    ).sort("updated_at", -1).limit(50)
    
    history = []
    async for record in cursor:
        history.append({
            "traits": record["traits"],
            "updated_at": record["updated_at"],
            "trigger_entry_id": record.get("trigger_entry_id")
        })
    
    return history