import json
import os
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Type
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
import google.generativeai as genai
from col_full_test import scrape_all_boxscores

# Global cache variables (outside of Pydantic model to avoid conflicts)
_cached_data: Optional[Dict[Any, Any]] = None
_cache_timestamp: Optional[datetime] = None

class ESPNScraperInput(BaseModel):
    """Input for ESPN College Football Scraper"""
    analyze_data: bool = Field(default=True, description="Whether to analyze the scraped data with Gemini")
    custom_prompt: str = Field(default="", description="Custom prompt for Gemini analysis")

class ESPNCollegeFootballTool(BaseTool):
    """Tool that scrapes ESPN college football data and optionally analyzes it with Gemini"""
    
    name: str = "espn_college_football_scraper"
    description: str = """
    Scrapes current college football game data from ESPN including:
    - Game scores and status
    - Team information and records
    - Detailed player statistics
    - Box score data
    
    Can optionally analyze the data using Gemini AI.
    Data is cached for 7 minutes to avoid unnecessary scraping.
    """
    args_schema: Type[BaseModel] = ESPNScraperInput
    gemini_api_key: Optional[str] = Field(default=None)
    
    _cache_duration_minutes: int = 7
    
    def __init__(self, gemini_api_key: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        object.__setattr__(self, 'gemini_api_key', gemini_api_key or os.getenv('GEMINI_API_KEY'))
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
    
    def _is_cache_valid(self) -> bool:
        """Check if cached data is still valid (within 7 minutes)"""
        global _cached_data, _cache_timestamp
        if _cached_data is None or _cache_timestamp is None:
            return False
        
        time_elapsed = datetime.now() - _cache_timestamp
        return time_elapsed < timedelta(minutes=self._cache_duration_minutes)
    
    def _get_or_scrape_data(self) -> Optional[Dict[Any, Any]]:
        """Get data from cache or scrape new data if cache is expired"""
        global _cached_data, _cache_timestamp
        
        if self._is_cache_valid():
            print("📋 Using cached data (less than 7 minutes old)")
            return _cached_data
        
        print("🏈 Cache expired or empty - scraping fresh ESPN data...")
        scraped_data = scrape_all_boxscores()
        
        if scraped_data:
            # Update global cache
            _cached_data = scraped_data
            _cache_timestamp = datetime.now()
            print(f"💾 Data cached at {_cache_timestamp.strftime('%H:%M:%S')}")
        
        return scraped_data
    
    def _run(self, analyze_data: bool = True, custom_prompt: str = "") -> str:
        """Execute the tool"""
        try:
            # Step 1: Get data (cached or fresh)
            scraped_data = self._get_or_scrape_data()
            
            if not scraped_data:
                return "❌ Failed to get ESPN data"
            
            # Step 2: Format the basic response
            games_count = scraped_data.get('total_games', 0)
            cache_status = "📋 cached" if self._is_cache_valid() else "🆕 fresh"
            basic_response = f"✅ Got {games_count} college football games from ESPN ({cache_status})"
            
            # Step 3: Analyze with Gemini if requested
            if analyze_data and self.gemini_api_key:
                analysis = self._analyze_with_gemini(scraped_data, custom_prompt)
                return f"{basic_response}\n\n🤖 Gemini Analysis:\n{analysis}"
            
            # Return basic summary if no analysis requested
            summary = self._create_basic_summary(scraped_data)
            return f"{basic_response}\n\n📊 Summary:\n{summary}"
            
        except Exception as e:
            return f"❌ Error: {str(e)}"
    
    def _analyze_with_gemini(self, data: Dict[Any, Any], custom_prompt: str) -> str:
        """Analyze scraped data with Gemini"""
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Prepare the prompt
            if custom_prompt:
                prompt = f"{custom_prompt}\n\nData to analyze:\n{json.dumps(data, indent=2)}"
            else:
                prompt = f"""
                Analyze this college football data from ESPN and provide insights:
                
                1. Highlight the most interesting games or storylines
                2. Identify any upsets or surprising scores
                3. Note any standout player performances
                4. Provide a brief summary of the day's action
                
                Data:
                {json.dumps(data, indent=2)}
                """
            
            response = model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Failed to analyze with Gemini: {str(e)}"
    
    def _create_basic_summary(self, data: Dict[Any, Any]) -> str:
        """Create a basic summary without AI analysis"""
        games = data.get('games', {})
        summary_lines = []
        
        for game_id, game_data in games.items():
            game_info = game_data.get('game_info', {})
            
            # Get team names and scores from quarter_scores
            quarter_scores = game_info.get('quarter_scores', {})
            if quarter_scores:
                teams = list(quarter_scores.keys())
                if len(teams) >= 2:
                    team1, team2 = teams[0], teams[1]
                    score1 = quarter_scores[team1].get('T', '0')
                    score2 = quarter_scores[team2].get('T', '0')
                    
                    # Add game status if available
                    game_status = game_info.get('game_status', {})
                    status_info = ""
                    if game_status:
                        quarter = game_status.get('quarter', '')
                        time_remaining = game_status.get('time_remaining', '')
                        if quarter and time_remaining:
                            status_info = f" ({time_remaining} {quarter})"
                    
                    summary_lines.append(f"• {team1} {score1} - {score2} {team2}{status_info}")
        
        return "\n".join(summary_lines) if summary_lines else "No game summaries available"

def create_espn_tool(gemini_api_key: Optional[str] = None) -> ESPNCollegeFootballTool:
    """Factory function to create the ESPN tool"""
    return ESPNCollegeFootballTool(gemini_api_key=gemini_api_key)

# Simple test function
def test_tool():
    """Test the tool functionality"""
    tool = create_espn_tool()
    result = tool._run(analyze_data=True, custom_prompt="Give me the top 3 most exciting games today")
    print(result)

if __name__ == "__main__":
    test_tool()
