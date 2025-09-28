#!/usr/bin/env python3
"""
Quick script to inspect what's actually in the cached ESPN data
"""
import json
from espn_langchain_tool import _cached_data, _cache_timestamp

def inspect_cache():
    """Inspect the current cached data"""
    print("🔍 Inspecting ESPN Cache")
    print("=" * 40)
    
    if _cached_data is None:
        print("❌ No cached data found")
        return
    
    if _cache_timestamp:
        print(f"📅 Cached at: {_cache_timestamp}")
    
    print(f"🎮 Total games: {_cached_data.get('total_games', 'Unknown')}")
    
    games = _cached_data.get('games', {})
    print(f"📊 Games in cache: {len(games)}")
    
    # Show structure of first game
    if games:
        first_game_id = list(games.keys())[0]
        first_game = games[first_game_id]
        
        print(f"\n🏈 Sample Game ({first_game_id}):")
        print("  Structure:")
        for key in first_game.keys():
            print(f"    - {key}: {type(first_game[key])}")
        
        # Check game_info
        game_info = first_game.get('game_info', {})
        print(f"\n  📋 Game Info Keys: {list(game_info.keys())}")
        
        teams = game_info.get('teams', [])
        print(f"  👥 Teams found: {len(teams)}")
        
        if teams:
            for i, team in enumerate(teams):
                print(f"    Team {i+1}: {team}")
        
        # Check team stats
        team_stats = first_game.get('teams', {})
        print(f"\n  📈 Team Stats Keys: {list(team_stats.keys())}")
        
        # Show a sample of the actual data structure
        print(f"\n📄 Raw sample (first 500 chars):")
        print(str(first_game)[:500] + "...")
    
    else:
        print("❌ No games found in cached data")

if __name__ == "__main__":
    inspect_cache()
