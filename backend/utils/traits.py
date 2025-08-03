import re
import numpy as np
from typing import Dict, List
from collections import Counter, defaultdict
import heapq
from datetime import datetime, timedelta
from database import get_database
from bson import ObjectId
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

class TraitAnalyzer:
    def __init__(self):
        # Keywords associated with each Big Five trait
        self.trait_keywords = {
            "openness": {
                "positive": ["creative", "imaginative", "curious", "artistic", "innovative", "explore", "new", "adventure", "learn", "discover"],
                "negative": ["routine", "conventional", "traditional", "practical", "realistic", "simple", "ordinary", "familiar"]
            },
            "conscientiousness": {
                "positive": ["organized", "planned", "disciplined", "goal", "achieve", "complete", "responsible", "efficient", "focused", "productive"],
                "negative": ["disorganized", "procrastinate", "lazy", "messy", "chaotic", "unfocused", "incomplete", "rushed"]
            },
            "extraversion": {
                "positive": ["social", "party", "friends", "talk", "energetic", "outgoing", "confident", "leadership", "group", "meeting"],
                "negative": ["alone", "quiet", "solitude", "introvert", "tired", "withdrawn", "shy", "avoid", "isolation"]
            },
            "agreeableness": {
                "positive": ["help", "kind", "caring", "empathy", "cooperation", "team", "support", "understanding", "compassion", "generous"],
                "negative": ["conflict", "argue", "competitive", "selfish", "disagreement", "criticism", "harsh", "stubborn"]
            },
            "neuroticism": {
                "positive": ["anxious", "stress", "worry", "nervous", "overwhelmed", "panic", "fear", "unstable", "emotional", "sensitive"],
                "negative": ["calm", "relaxed", "stable", "confident", "peaceful", "composed", "balanced", "secure"]
            }
        }
    
    def analyze_text_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze text and return trait adjustments using keyword frequency analysis"""
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        word_count = Counter(words)
        
        trait_scores = {}
        
        for trait, keywords in self.trait_keywords.items():
            positive_score = sum(word_count[word] for word in keywords["positive"] if word in word_count)
            negative_score = sum(word_count[word] for word in keywords["negative"] if word in word_count)
            
            # Calculate net sentiment for this trait
            net_score = positive_score - negative_score
            total_words = len(words)
            
            # Normalize by text length and apply scaling
            if total_words > 0:
                normalized_score = (net_score / total_words) * 10
                # Apply sigmoid-like function to bound changes
                trait_scores[trait] = np.tanh(normalized_score) * 0.5  # Max change of 0.5 per entry
            else:
                trait_scores[trait] = 0.0
        
        return trait_scores
    
    async def get_ai_personality_analysis(self, text: str, current_traits: Dict[str, float]) -> Dict[str, float]:
        """Use OpenAI API via OpenRouter for advanced personality analysis"""
        api_key = os.getenv("OPENROUTER_API_KEY")
        
        prompt = f"""
        Analyze the following journal entry and determine how it might affect the writer's Big Five personality traits.
        
        Current traits (0-10 scale):
        - Openness: {current_traits.get('openness', 5.0)}
        - Conscientiousness: {current_traits.get('conscientiousness', 5.0)}
        - Extraversion: {current_traits.get('extraversion', 5.0)}
        - Agreeableness: {current_traits.get('agreeableness', 5.0)}
        - Neuroticism: {current_traits.get('neuroticism', 5.0)}
        
        Journal entry: "{text}"
        
        Return ONLY a JSON object with trait adjustments (how much to add/subtract from each trait, range -0.3 to +0.3):
        {{"openness": 0.0, "conscientiousness": 0.0, "extraversion": 0.0, "agreeableness": 0.0, "neuroticism": 0.0}}
        """
        
        try:
            async with httpx.AsyncClient() as client:
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
                    
                    # Extract JSON from response
                    import json
                    try:
                        adjustments = json.loads(content)
                        # Ensure all traits are present and bounded
                        bounded_adjustments = {}
                        for trait in ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]:
                            value = adjustments.get(trait, 0.0)
                            bounded_adjustments[trait] = max(-0.3, min(0.3, value))
                        return bounded_adjustments
                    except json.JSONDecodeError:
                        # Fallback to keyword analysis if JSON parsing fails
                        return self.analyze_text_sentiment(text)
                else:
                    return self.analyze_text_sentiment(text)
        except Exception:
            # Fallback to keyword analysis if API fails
            return self.analyze_text_sentiment(text)

async def update_traits_from_entry(user_id: ObjectId, entry_content: str):
    """Update user traits based on new journal entry using adaptive algorithm"""
    db = get_database()
    analyzer = TraitAnalyzer()
    
    # Get current user and traits
    user = await db.users.find_one({"_id": user_id})
    if not user:
        return
    
    current_traits = user.get("traits", {
        "openness": 5.0,
        "conscientiousness": 5.0,
        "extraversion": 5.0,
        "agreeableness": 5.0,
        "neuroticism": 5.0
    })
    
    # Get recent entries for trend analysis (university-level algorithm)
    recent_entries = []
    cursor = db.journal_entries.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(10)
    
    async for entry in cursor:
        recent_entries.append(entry["content"])
    
    # Combine recent entries for context
    combined_text = entry_content
    if len(recent_entries) > 1:
        # Use a sliding window approach with weighted importance
        weights = [0.4, 0.2, 0.15, 0.1, 0.05, 0.05, 0.025, 0.025]
        weighted_text = entry_content  # Current entry has highest weight
        for i, old_entry in enumerate(recent_entries[1:8]):  # Skip current entry
            if i < len(weights) - 1:
                # Add weighted influence of older entries
                weighted_text += f" {old_entry[:100]}"  # Truncate older entries
    
    # Get AI analysis
    ai_adjustments = await analyzer.get_ai_personality_analysis(combined_text, current_traits)
    
    # Get keyword-based analysis as backup/validation
    keyword_adjustments = analyzer.analyze_text_sentiment(entry_content)
    
    # Combine both analyses with weighted average
    final_adjustments = {}
    for trait in current_traits.keys():
        ai_adj = ai_adjustments.get(trait, 0.0)
        keyword_adj = keyword_adjustments.get(trait, 0.0)
        
        # Weight AI analysis higher but use keyword analysis as validation
        combined_adj = (ai_adj * 0.7) + (keyword_adj * 0.3)
        
        # Apply temporal smoothing using exponential moving average
        final_adjustments[trait] = combined_adj * 0.8  # Reduce volatility
    
    # Update traits with bounds checking
    new_traits = {}
    for trait, current_value in current_traits.items():
        adjustment = final_adjustments.get(trait, 0.0)
        new_value = current_value + adjustment
        
        # Ensure traits stay within 0-10 bounds
        new_traits[trait] = max(0.0, min(10.0, new_value))
    
    # Update user in database
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "traits": new_traits,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Store trait history for tracking changes over time
    await db.trait_history.insert_one({
        "user_id": user_id,
        "traits": new_traits,
        "previous_traits": current_traits,
        "adjustments": final_adjustments,
        "updated_at": datetime.utcnow(),
        "trigger_entry_content": entry_content[:200]  # Store snippet for context
    })