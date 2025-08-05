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
from collections import Counter
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
        """Analyze patterns in journal entries"""
        if not entries:
            return {"themes": [], "mood_trend": "neutral", "activity_patterns": {}}
        
        # Count themes across all entries
        theme_counter = Counter()
        mood_scores = []
        word_frequency = Counter()
        
        for entry in entries:
            content = entry.get("content", "")
            words = [word.lower() for word in content.split() if len(word) > 3]
            
            # Count meaningful words
            word_frequency.update(words)
            
            # Extract and count themes
            themes = self.extract_themes(content)
            theme_counter.update(themes)
            
            # Track mood ratings
            if entry.get("mood_rating"):
                mood_scores.append(entry["mood_rating"])
        
        # Simple mood trend calculation
        mood_trend = "neutral"
        if len(mood_scores) >= 3:
            recent_avg = sum(mood_scores[-3:]) / 3
            overall_avg = sum(mood_scores) / len(mood_scores)
            if recent_avg > overall_avg + 0.3:
                mood_trend = "improving"
            elif recent_avg < overall_avg - 0.3:
                mood_trend = "declining"
        
        return {
            "themes": [theme for theme, _ in theme_counter.most_common(5)],
            "mood_trend": mood_trend,
            "top_words": [word for word, _ in word_frequency.most_common(10)],
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
    
    def generate_trait_insights(self, traits, journal_analysis: Dict) -> Dict:
        """Generate trait-specific insights and priorities for strategic planning"""
        insights = {}
        priority_areas = []
        
        # Analyze each trait with contextual insights
        openness = traits.openness
        if openness >= 7:
            insights['openness'] = "High creativity and openness to new experiences"
            priority_areas.append("• Leverage creative thinking for innovative solutions")
        elif openness <= 3:
            insights['openness'] = "Preference for familiar routines and proven methods"
            priority_areas.append("• Introduce small, manageable changes gradually")
        else:
            insights['openness'] = "Balanced approach to new experiences and stability"
        
        conscientiousness = traits.conscientiousness
        if conscientiousness >= 7:
            insights['conscientiousness'] = "Strong self-discipline and goal orientation"
            priority_areas.append("• Channel organization skills into long-term planning")
        elif conscientiousness <= 3:
            insights['conscientiousness'] = "Flexible approach, may benefit from structure"
            priority_areas.append("• Build sustainable habits through simple systems")
        else:
            insights['conscientiousness'] = "Moderate self-discipline with room for growth"
        
        extraversion = traits.extraversion
        if extraversion >= 7:
            insights['extraversion'] = "Energized by social interaction and external stimulation"
            priority_areas.append("• Use social connections as motivation and accountability")
        elif extraversion <= 3:
            insights['extraversion'] = "Thrives in quieter, more reflective environments"
            priority_areas.append("• Design solitary practices that align with introspective nature")
        else:
            insights['extraversion'] = "Comfortable in both social and solitary settings"
        
        agreeableness = traits.agreeableness
        if agreeableness >= 7:
            insights['agreeableness'] = "Highly cooperative and considerate of others"
            priority_areas.append("• Balance helping others with self-care practices")
        elif agreeableness <= 3:
            insights['agreeableness'] = "Direct and competitive, values personal achievement"
            priority_areas.append("• Set clear boundaries while maintaining important relationships")
        else:
            insights['agreeableness'] = "Balanced between cooperation and assertiveness"
        
        neuroticism = traits.neuroticism
        if neuroticism >= 7:
            insights['neuroticism'] = "Higher emotional sensitivity, may experience stress intensely"
            priority_areas.append("• Prioritize stress management and emotional regulation techniques")
        elif neuroticism <= 3:
            insights['neuroticism'] = "Emotionally stable and resilient under pressure"
            priority_areas.append("• Use emotional stability to support others and take on challenges")
        else:
            insights['neuroticism'] = "Generally stable with occasional emotional fluctuations"
        
        # Determine engagement level based on entry frequency and conscientiousness
        entry_count = journal_analysis.get('entry_count', 0)
        if entry_count >= 15 and conscientiousness >= 6:
            insights['engagement_level'] = "high commitment to self-reflection"
        elif entry_count >= 8:
            insights['engagement_level'] = "consistent journaling practice"
        elif entry_count <= 3:
            insights['engagement_level'] = "irregular reflection pattern - may benefit from habit building"
        else:
            insights['engagement_level'] = "moderate self-reflection engagement"
        
        insights['priority_areas'] = '\n'.join(priority_areas)
        
        return insights
    
    async def generate_strategic_plan(self, user: User, journal_analysis: Dict) -> Dict:
        """Generate strategic plan using OpenAI API"""
        api_key = os.getenv("OPENROUTER_API_KEY")
        
        # Create trait-driven insights for strategic planning
        trait_insights = self.generate_trait_insights(user.traits, journal_analysis)
        
        # Create comprehensive prompt with deep trait integration
        prompt = f"""
        You are Kira, a wise AI advisor inspired by Japanese Zen philosophy. Create a strategic life plan by deeply integrating this user's personality traits with their journal patterns.

        PERSONALITY PROFILE ANALYSIS:
        - Openness: {user.traits.openness}/10 - {trait_insights['openness']}
        - Conscientiousness: {user.traits.conscientiousness}/10 - {trait_insights['conscientiousness']}  
        - Extraversion: {user.traits.extraversion}/10 - {trait_insights['extraversion']}
        - Agreeableness: {user.traits.agreeableness}/10 - {trait_insights['agreeableness']}
        - Neuroticism: {user.traits.neuroticism}/10 - {trait_insights['neuroticism']}

        JOURNAL PATTERNS & TRAIT CORRELATION:
        - Dominant themes: {', '.join(journal_analysis.get('themes', []))} 
        - Emotional trajectory: {journal_analysis.get('mood_trend', 'neutral')}
        - Focus areas: {', '.join(journal_analysis.get('top_words', [])[:5])}
        - Entry frequency: {journal_analysis.get('entry_count', 0)} entries (shows {trait_insights['engagement_level']})

        TRAIT-SPECIFIC GUIDANCE PRIORITIES:
        {trait_insights['priority_areas']}

        Create a strategic plan that directly leverages their personality strengths while addressing growth areas:
        1. Analysis that connects journal themes to specific trait patterns
        2. 4-5 recommendations that align with their personality profile (reference specific traits)
        3. A Zen insight that speaks to their unique trait combination

        Respond in JSON format:
        {{
            "title": "Strategic Plan Title (referencing key traits)",
            "analysis": "Deep analysis connecting journal patterns to Big Five traits...",
            "recommendations": [
                "Trait-specific actionable recommendation 1",
                "Trait-specific actionable recommendation 2", 
                "Trait-specific actionable recommendation 3",
                "Trait-specific actionable recommendation 4"
            ],
            "zen_insight": "A Zen insight tailored to their personality profile..."
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
                        "model": "openai/gpt-4o-mini",
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
        """Create a trait-driven fallback strategic plan if AI generation fails"""
        recommendations = []
        trait_insights = self.generate_trait_insights(user.traits, analysis)
        
        # Generate trait-specific recommendations with higher weighting
        if user.traits.conscientiousness < 5:
            if user.traits.openness > 6:
                recommendations.append("Create a flexible daily routine that allows for creative exploration while building structure")
            else:
                recommendations.append("Start with one simple daily habit to gradually build organizational skills")
        
        if user.traits.neuroticism > 6:
            if user.traits.extraversion < 4:
                recommendations.append("Practice solo mindfulness meditation to manage stress in your preferred quiet environment")
            else:
                recommendations.append("Join a group meditation or stress-management class to combine social energy with calm practices")
        
        if user.traits.openness > 7:
            if user.traits.conscientiousness > 6:
                recommendations.append("Channel your creativity into a structured project with clear milestones and deadlines")
            else:
                recommendations.append("Explore new creative outlets without pressure - let curiosity guide your journey")
        
        if user.traits.extraversion < 4 and user.traits.agreeableness > 6:
            recommendations.append("Find meaningful one-on-one connections that honor your introverted nature while expressing your caring side")
        
        # Weight theme-based recommendations by relevant traits
        themes = analysis.get('themes', [])
        if 'work_stress' in themes:
            if user.traits.agreeableness > 6:
                recommendations.append("Set gentle but firm boundaries at work - your caring nature shouldn't come at the cost of your wellbeing")
            else:
                recommendations.append("Leverage your natural assertiveness to establish clear work-life boundaries")
        
        if 'health_wellness' in themes:
            if user.traits.conscientiousness > 6:
                recommendations.append("Create a detailed wellness plan with tracking to satisfy your organized nature")
            else:
                recommendations.append("Focus on intuitive wellness practices that feel natural rather than forced routines")
        
        # Create trait-aware analysis
        dominant_traits = []
        if user.traits.openness >= 7: dominant_traits.append("highly creative")
        if user.traits.conscientiousness >= 7: dominant_traits.append("well-organized")
        if user.traits.extraversion >= 7: dominant_traits.append("socially energized")
        if user.traits.agreeableness >= 7: dominant_traits.append("deeply caring")
        if user.traits.neuroticism <= 3: dominant_traits.append("emotionally stable")
        
        trait_description = ", ".join(dominant_traits) if dominant_traits else "balanced across personality dimensions"
        
        return {
            "title": f"Strategic Path for a {trait_description.title()} Individual",
            "analysis": f"Your personality profile shows you are {trait_description}. Combined with your recent focus on {', '.join(themes[:3])} and {analysis.get('mood_trend', 'stable')} emotional patterns, this suggests specific pathways for growth.",
            "recommendations": recommendations[:4],
            "zen_insight": f"Like a tree that grows according to its nature - some reaching wide, others growing tall - honor your natural tendencies ({trait_description}) while gently stretching toward new light."
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