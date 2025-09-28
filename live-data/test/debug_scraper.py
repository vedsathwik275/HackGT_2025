#!/usr/bin/env python3
"""
Debug script to test the ESPN scraper directly
"""
from col_full_test import scrape_all_boxscores
import json

def test_scraper():
    """Test the ESPN scraper directly"""
    print("🏈 Testing ESPN scraper directly...")
    print("=" * 50)
    
    try:
        # Test the scraper
        data = scrape_all_boxscores()
        
        if data:
            print(f"✅ Success! Got {data.get('total_games', 0)} games")
            print(f"📅 Scraped at: {data.get('scrape_timestamp', 'Unknown')}")
            
            # Show first few games
            games = data.get('games', {})
            if games:
                print("\n📊 Sample games:")
                for i, (game_id, game_data) in enumerate(list(games.items())[:3]):
                    game_info = game_data.get('game_info', {})
                    teams = game_info.get('teams', [])
                    
                    if len(teams) >= 2:
                        team1 = teams[0].get('short_name', 'Team 1')
                        team2 = teams[1].get('short_name', 'Team 2')
                        score1 = teams[0].get('current_score', '0')
                        score2 = teams[1].get('current_score', '0')
                        print(f"  {i+1}. {team1} {score1} - {score2} {team2}")
            else:
                print("⚠️  No games found in data")
                
            return True
        else:
            print("❌ Scraper returned None/empty data")
            return False
            
    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_tool():
    """Test the LangChain tool"""
    print("\n🔧 Testing LangChain tool...")
    print("=" * 30)
    
    try:
        from espn_langchain_tool import create_espn_tool
        
        tool = create_espn_tool()
        result = tool._run(analyze_data=False)  # Just get raw data
        
        print(f"Tool result: {result}")
        
        if "❌" in result:
            print("⚠️  Tool returned error")
            return False
        else:
            print("✅ Tool working")
            return True
            
    except Exception as e:
        print(f"❌ Error testing tool: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🐛 ESPN Scraper Debug Script")
    print("=" * 50)
    
    # Test 1: Direct scraper
    #scraper_ok = test_scraper()
    
    # Test 2: LangChain tool
    tool_ok = test_tool()
    
    print("\n📋 Summary:")
    #print(f"  Direct scraper: {'✅' if scraper_ok else '❌'}")
    print(f"  LangChain tool: {'✅' if tool_ok else '❌'}")
    
    if not scraper_ok:
        print("\n💡 Suggestions:")
        print("  • Check internet connection")
        print("  • ESPN might be blocking requests")
        print("  • Try running during game time")
        print("  • Check if ESPN changed their HTML structure")
