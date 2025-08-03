from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from models.strategic_plan import StrategicPlan, StrategicPlanResponse
from models.user import User
from utils.auth import get_current_user
from database import get_database
from datetime import datetime, timedelta
import httpx
import os
from dotenv import load_dotenv
from collections import defaultdict, Counter
import heapq
import json

load_dotenv()

router = APIRouter()

class StrategicPlanGenerator:
    def __init__(self):
        self.zen_principles = [
            "Find balance in all things, like water flowing around stones",
            "Embrace impermanence - this too shall pass and evolve", 
            "Practice mindful presence in each moment",
            "Seek harmony between action and reflection",
            "Let go of what you cannot control, focus on what you can",
            "Cultivate inner peace to navigate outer storms",
            "Progress comes from small, consistent steps",
            "Honor both your achievements and your struggles"
        ]
    
    def analyze_journal_patterns(self, entries: List[Dict]) -> Dict:
        """Analyze patterns in journal entries using data structures"""
        if not entries:
            return {"themes": [], "mood_trend": "neutral", "activity_patterns": {}}
        
        # Use hash map for theme counting
        theme_counter = Counter()
        mood_scores = []
        word_frequency = defaultdict(int)
        
        # Priority queue for most significant entries (by length and recency)
        significant_entries = []
        
        for i, entry in enumerate(entries):
            content = entry.get("content", "")
            words = content.lower().split()
            
            # Count word frequency
            for word in words:
                if len(word) > 3:  # Filter out small words
                    word_frequency[word] += 1
            
            # Extract themes using keyword analysis
            themes = self.extract_themes(content)
            theme_counter.update(themes)
            
            # Track mood if available
            if entry.get("mood_rating"):
                mood_scores.append(entry["mood_rating"])
            
            # Use heap to track most significant entries
            significance_score = len(content) + (len(entries) - i) * 10  # Recency weight
            if len(significant_entries) < 5:
                heapq.heappush(significant_entries, (significance_score, content))
            else:
                heapq.heappushpop(significant_entries, (significance_score, content))
        
        # Calculate mood trend
        mood_trend = "neutral"
        if mood_scores:
            avg_mood = sum(mood_scores) / len(mood_scores)
            recent_mood = sum(mood_scores[-3:]) / len(mood_scores[-3:]) if len(mood_scores) >= 3 else avg_mood
            if recent_mood > avg_mood + 0.5:
                mood_trend = "improving"
            elif recent_mood < avg_mood - 0.5:
                mood_trend = "declining"
        
        # Get top themes
        top_themes = [theme for theme, count in theme_counter.most_common(5)]
        
        # Get most frequent meaningful words
        top_words = [word for word, freq in Counter(word_frequency).most_common(10)]
        
        return {
            "themes": top_themes,
            "mood_trend": mood_trend,
            "top_words": top_words,
            "significant_entries": [content for _, content in significant_entries],
            "entry_count": len(entries)
        }
    
    def extract_themes(self, content: str) -> List[str]:
        """Extract themes from journal content using keyword matching"""
        themes = []
        content_lower = content.lower()
        
        theme_keywords = {
            "work_stress": ["work", "job", "boss", "deadline", "meeting", "project", "stress", "pressure"],
            "relationships": ["friend", "family", "partner", "relationship", "love", "conflict", "social"],
            "health_wellness": ["exercise", "health", "sleep", "tired", "energy", "wellness", "diet"],
            "personal_growth": ["learn", "growth", "improve", "goal", "achieve", "progress", "develop"],
            "creativity": ["create", "art", "music", "write", "design", "imagination", "creative"],
            "anxiety_worry": ["anxious", "worry", "nervous", "fear", "panic", "stress", "overwhelmed"],
            "happiness_joy": ["happy", "joy", "excited", "grateful", "celebration", "success", "good"],
            "solitude_reflection": ["alone", "quiet", "reflect", "think", "meditate", "peace", "solitude"]
        }
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                themes.append(theme)
        
        return themes
    
    async def generate_strategic_plan(self, user: User, journal_analysis: Dict) -> Dict:
        """Generate strategic plan using OpenAI API"""
        api_key = os.getenv("OPENROUTER_API_KEY")
        
        # Create comprehensive prompt with user traits and journal analysis
        prompt = f"""
        You are Kira, a wise AI advisor inspired by Japanese Zen philosophy. Analyze this user's journal patterns and personality traits to create a strategic life plan.

        USER PERSONALITY TRAITS (Big Five, 0-10 scale):
        - Openness: {user.traits.openness}/10
        - Conscientiousness: {user.traits.conscientiousness}/10  
        - Extraversion: {user.traits.extraversion}/10
        - Agreeableness: {user.traits.agreeableness}/10
        - Neuroticism: {user.traits.neuroticism}/10

        JOURNAL ANALYSIS:
        - Recent themes: {', '.join(journal_analysis.get('themes', []))}
        - Mood trend: {journal_analysis.get('mood_trend', 'neutral')}
        - Key focus areas: {', '.join(journal_analysis.get('top_words', [])[:5])}
        - Number of recent entries: {journal_analysis.get('entry_count', 0)}

        Create a strategic plan with:
        1. A thoughtful analysis of their current life patterns
        2. 3-5 specific, actionable recommendations tailored to their personality
        3. A Zen-inspired insight for mindful living

        Respond in JSON format:
        {{
            "title": "Strategic Plan Title",
            "analysis": "Deep analysis of current patterns and traits...",
            "recommendations": [
                "Specific actionable recommendation 1",
                "Specific actionable recommendation 2", 
                "Specific actionable recommendation 3"
            ],
            "zen_insight": "A beautiful Zen-inspired insight about their journey..."
        }}
        """
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "HTTP-Referer": "http://localhost:8000",
                        "X-Title": "KiraAI"
                    },
                    json={
                        "model": "openai/o1-mini",
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    
                    # Parse JSON response
                    try:
                        plan_data = json.loads(content)
                        return plan_data
                    except json.JSONDecodeError:
                        # Fallback if JSON parsing fails
                        return self.create_fallback_plan(user, journal_analysis)
                else:
                    return self.create_fallback_plan(user, journal_analysis)
                    
        except Exception:
            return self.create_fallback_plan(user, journal_analysis)
    
    def create_fallback_plan(self, user: User, analysis: Dict) -> Dict:
        """Create a fallback strategic plan if AI generation fails"""
        recommendations = []
        
        # Generate recommendations based on traits
        if user.traits.conscientiousness < 5:
            recommendations.append("Create a simple daily routine to build structure and achieve your goals")
        if user.traits.neuroticism > 6:
            recommendations.append("Practice mindfulness meditation for 10 minutes daily to cultivate inner calm")
        if user.traits.openness > 7:
            recommendations.append("Explore a new creative hobby or learning opportunity this month")
        if user.traits.extraversion < 4:
            recommendations.append("Schedule one meaningful social connection each week")
        
        # Add theme-based recommendations
        themes = analysis.get('themes', [])
        if 'work_stress' in themes:
            recommendations.append("Set boundaries between work and personal time")
        if 'health_wellness' in themes:
            recommendations.append("Focus on consistent sleep schedule and gentle movement")
        
        return {
            "title": "Your Path Forward",
            "analysis": f"Based on your recent reflections, you're navigating themes of {', '.join(themes[:3])} with a {analysis.get('mood_trend', 'stable')} emotional trajectory.",
            "recommendations": recommendations[:4],
            "zen_insight": "Like bamboo that bends but does not break, find strength in flexibility and growth in your challenges."
        }

generator = StrategicPlanGenerator()

@router.post("/generate", response_model=StrategicPlanResponse)
async def generate_strategic_plan(current_user: User = Depends(get_current_user)):
    """Generate a new strategic plan based on recent journal entries and user traits"""
    db = get_database()
    
    # Get recent journal entries (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    cursor = db.journal_entries.find({
        "user_id": current_user.id,
        "created_at": {"$gte": thirty_days_ago}
    }).sort("created_at", -1).limit(20)
    
    entries = []
    async for entry in cursor:
        entries.append({
            "content": entry["content"],
            "mood_rating": entry.get("mood_rating"),
            "created_at": entry["created_at"]
        })
    
    if not entries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No recent journal entries found. Please write some journal entries first."
        )
    
    # Analyze journal patterns
    analysis = generator.analyze_journal_patterns(entries)
    
    # Generate strategic plan
    plan_data = await generator.generate_strategic_plan(current_user, analysis)
    
    # Store in database
    entry_ids = []
    cursor = db.journal_entries.find({
        "user_id": current_user.id,
        "created_at": {"$gte": thirty_days_ago}
    }).sort("created_at", -1).limit(10)
    
    async for entry in cursor:
        entry_ids.append(entry["_id"])
    
    strategic_plan = {
        "user_id": current_user.id,
        "title": plan_data["title"],
        "analysis": plan_data["analysis"],
        "recommendations": plan_data["recommendations"],
        "zen_insight": plan_data.get("zen_insight", ""),
        "generated_at": datetime.utcnow(),
        "based_on_entries": entry_ids
    }
    
    result = await db.strategic_plans.insert_one(strategic_plan)
    created_plan = await db.strategic_plans.find_one({"_id": result.inserted_id})
    
    return StrategicPlanResponse(
        id=str(created_plan["_id"]),
        title=created_plan["title"],
        analysis=created_plan["analysis"],
        recommendations=created_plan["recommendations"],
        generated_at=created_plan["generated_at"],
        zen_insight=created_plan.get("zen_insight", "")
    )

@router.get("/history", response_model=List[StrategicPlanResponse])
async def get_strategic_plan_history(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Get user's strategic plan history"""
    db = get_database()
    
    cursor = db.strategic_plans.find({
        "user_id": current_user.id
    }).sort("generated_at", -1).skip(skip).limit(limit)
    
    plans = []
    async for plan in cursor:
        plans.append(StrategicPlanResponse(
            id=str(plan["_id"]),
            title=plan["title"],
            analysis=plan["analysis"],
            recommendations=plan["recommendations"],
            generated_at=plan["generated_at"],
            zen_insight=plan.get("zen_insight", "")
        ))
    
    return plans