#!/usr/bin/env python3
"""
Smart Cache Manager for ESPN College Football Data
Implements intelligent caching with game-specific updates
"""
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from col_full_test import scrape_comprehensive_boxscore, scrape_game_ids_from_scoreboard
import re

class SmartESPNCacheManager:
    """
    Smart caching system that:
    1. Caches individual games with 2-minute expiry
    2. Full dataset refresh every 10 minutes
    3. Player-to-game mapping for targeted updates
    """
    
    def __init__(self):
        # Individual game cache: {game_id: {'data': game_data, 'timestamp': datetime, 'metadata': metadata}}
        self.game_cache: Dict[str, Dict] = {}
        
        # Full dataset metadata
        self.full_dataset_timestamp: Optional[datetime] = None
        self.all_game_ids: Set[str] = set()
        
        # Cache duration settings
        self.individual_game_cache_minutes = 2
        self.full_dataset_cache_minutes = 10
        
        print("🧠 Smart ESPN Cache Manager initialized")
    
    def is_individual_game_fresh(self, game_id: str) -> bool:
        """Check if individual game cache is fresh (< 2 minutes)"""
        if game_id not in self.game_cache:
            return False
        
        game_entry = self.game_cache[game_id]
        if 'timestamp' not in game_entry:
            return False
        
        time_elapsed = datetime.now() - game_entry['timestamp']
        return time_elapsed < timedelta(minutes=self.individual_game_cache_minutes)
    
    def is_full_dataset_fresh(self) -> bool:
        """Check if full dataset cache is fresh (< 10 minutes)"""
        if self.full_dataset_timestamp is None:
            return False
        
        time_elapsed = datetime.now() - self.full_dataset_timestamp
        return time_elapsed < timedelta(minutes=self.full_dataset_cache_minutes)
    
    def get_current_game_ids(self) -> List[str]:
        """Get current game IDs from ESPN scoreboard"""
        try:
            game_ids = scrape_game_ids_from_scoreboard()
            return game_ids or []
        except Exception as e:
            print(f"⚠️  Error getting game IDs: {e}")
            return []
    
    def update_individual_game(self, game_id: str) -> Optional[Dict]:
        """Update cache for a specific game by re-scraping that game's boxscore"""
        try:
            print(f"🎯 Re-scraping individual game: {game_id}")
            print(f"   📡 Fetching fresh data from ESPN for game {game_id}...")
            
            # Scrape only this specific game's boxscore
            game_data = scrape_comprehensive_boxscore(game_id)
            
            if game_data:
                # Extract metadata (players and teams)
                metadata = self._extract_game_metadata(game_data)
                
                # Update cache with fresh data
                self.game_cache[game_id] = {
                    'data': game_data,
                    'timestamp': datetime.now(),
                    'metadata': metadata
                }
                
                print(f"✅ Game {game_id} re-scraped and cached successfully")
                print(f"   📊 Teams: {', '.join(metadata.get('teams', []))}")
                print(f"   👥 Players: {len(metadata.get('players', []))} tracked")
                
                # Show game status if available
                status = metadata.get('status', {})
                if status.get('quarter') and status.get('time_remaining'):
                    print(f"   ⏱️  Status: {status['time_remaining']} left in {status['quarter']}")
                
                return game_data
            else:
                print(f"❌ Failed to re-scrape game {game_id} - ESPN returned no data")
                return None
                
        except Exception as e:
            print(f"❌ Error re-scraping game {game_id}: {e}")
            return None
    
    def full_refresh(self) -> Dict[str, Any]:
        """Perform full dataset refresh"""
        print("🔄 Performing full dataset refresh...")
        
        # Get current game IDs
        current_game_ids = self.get_current_game_ids()
        if not current_game_ids:
            print("❌ No game IDs found")
            return {}
        
        print(f"📋 Found {len(current_game_ids)} games to refresh")
        
        # Update all games
        updated_games = {}
        for game_id in current_game_ids:
            game_data = self.update_individual_game(game_id)
            if game_data:
                updated_games[game_id] = game_data
        
        # Update metadata
        self.all_game_ids = set(current_game_ids)
        self.full_dataset_timestamp = datetime.now()
        
        print(f"✅ Full refresh complete: {len(updated_games)} games updated")
        return updated_games
    
    def _extract_game_metadata(self, game_data: Dict) -> Dict[str, Any]:
        """Extract metadata (teams and players) from game data"""
        metadata = {
            'teams': [],
            'players': [],
            'game_id': game_data.get('game_id', ''),
            'status': {}
        }
        
        try:
            # Extract teams from quarter_scores (most reliable)
            game_info = game_data.get('game_info', {})
            quarter_scores = game_info.get('quarter_scores', {})
            if quarter_scores:
                metadata['teams'] = list(quarter_scores.keys())
            
            # Extract game status
            game_status = game_info.get('game_status', {})
            if game_status:
                metadata['status'] = {
                    'quarter': game_status.get('quarter', ''),
                    'time_remaining': game_status.get('time_remaining', '')
                }
            
            # Extract all players from team stats
            teams = game_data.get('teams', {})
            all_players = []
            
            for team_name, team_data in teams.items():
                # Check all stat categories (passing, rushing, receiving, etc.)
                for stat_category, stat_data in team_data.items():
                    if isinstance(stat_data, dict) and 'players' in stat_data:
                        players = stat_data['players']
                        
                        for player in players:
                            player_name = player.get('name', '').strip()
                            if player_name and player_name not in all_players:
                                all_players.append(player_name)
            
            metadata['players'] = all_players
            
        except Exception as e:
            print(f"⚠️  Error extracting metadata: {e}")
        
        return metadata
    
    def find_games_by_query(self, query: str) -> List[str]:
        """Find games that match the query (teams or players)"""
        query_lower = query.lower().strip()
        matching_games = []
        
        for game_id, game_entry in self.game_cache.items():
            metadata = game_entry.get('metadata', {})
            
            # Check teams
            teams = metadata.get('teams', [])
            for team in teams:
                if team.lower() in query_lower or query_lower in team.lower():
                    if game_id not in matching_games:
                        matching_games.append(game_id)
            
            # Check players
            players = metadata.get('players', [])
            for player in players:
                if player.lower() in query_lower or query_lower in player.lower():
                    if game_id not in matching_games:
                        matching_games.append(game_id)
        
        return matching_games
    
    def get_smart_data(self, query_hint: str = "") -> Dict[str, Any]:
        """
        Smart data retrieval based on query context
        
        Args:
            query_hint: User's query to help identify which games to prioritize
        
        Returns:
            Complete dataset with smart caching
        """
        # Check if full dataset needs refresh
        if not self.is_full_dataset_fresh():
            print("🔄 Full dataset expired - performing full refresh")
            updated_games = self.full_refresh()
        else:
            print("📋 Full dataset is fresh")
            updated_games = {}
        
        # Find games that match the query (teams or players)
        matching_games = self.find_games_by_query(query_hint) if query_hint else []
        print(f"🔍 Query '{query_hint}' matches games: {matching_games}")
        
        # Update matching games if they're stale
        if matching_games:
            print(f"🎯 Found {len(matching_games)} games matching query - checking freshness...")
            for game_id in matching_games:
                if not self.is_individual_game_fresh(game_id):
                    print(f"🔄 Game {game_id} is stale (>2 min) - re-scraping individual game...")
                    updated_data = self.update_individual_game(game_id)
                    if updated_data:
                        updated_games[game_id] = updated_data
                else:
                    print(f"✅ Game {game_id} is fresh (<2 min) - using cached data")
        else:
            # No specific matches found, update a few stale games to keep data fresh
            print("🔍 No specific team/player matches - checking for any stale games to refresh...")
            stale_games = [game_id for game_id in self.game_cache.keys() 
                          if not self.is_individual_game_fresh(game_id)]
            if stale_games:
                print(f"🔄 Found {len(stale_games)} stale games, re-scraping first 3 to keep data fresh...")
                # Update a few stale games to keep data fresh
                for game_id in stale_games[:3]:  # Limit to 3 to avoid too much scraping
                    updated_data = self.update_individual_game(game_id)
                    if updated_data:
                        updated_games[game_id] = updated_data
            else:
                print("✅ All games are fresh - no re-scraping needed")
        
        # Compile final dataset
        final_dataset = {
            'scrape_timestamp': datetime.now().isoformat(),
            'total_games': len(self.game_cache),
            'games': {}
        }
        
        # Add all cached games
        for game_id, game_entry in self.game_cache.items():
            if 'data' in game_entry:
                final_dataset['games'][game_id] = game_entry['data']
        
        return final_dataset
    
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get current cache status for debugging"""
        # Count total players and teams across all games
        total_players = set()
        total_teams = set()
        
        for game_entry in self.game_cache.values():
            metadata = game_entry.get('metadata', {})
            total_players.update(metadata.get('players', []))
            total_teams.update(metadata.get('teams', []))
        
        return {
            'individual_games_cached': len(self.game_cache),
            'full_dataset_fresh': self.is_full_dataset_fresh(),
            'full_dataset_age_minutes': (
                (datetime.now() - self.full_dataset_timestamp).total_seconds() / 60
                if self.full_dataset_timestamp else None
            ),
            'total_players_tracked': len(total_players),
            'total_teams_tracked': len(total_teams),
            'fresh_games': sum(1 for game_id in self.game_cache.keys() 
                             if self.is_individual_game_fresh(game_id))
        }

# Global instance
smart_cache = SmartESPNCacheManager()

def get_smart_espn_data(query_hint: str = "") -> Dict[str, Any]:
    """Main function to get ESPN data with smart caching"""
    return smart_cache.get_smart_data(query_hint)

if __name__ == "__main__":
    # Test the smart cache
    print("🧪 Testing Smart Cache Manager")
    
    # Test 1: Full refresh
    data = get_smart_espn_data()
    print(f"📊 Got {data.get('total_games', 0)} games")
    
    # Test 2: Player-specific query
    player_data = get_smart_espn_data("Haynes King stats")
    print(f"🏈 Player query result: {player_data.get('total_games', 0)} games")
    
    # Test 3: Cache status
    status = smart_cache.get_cache_status()
    print(f"📋 Cache status: {status}")
