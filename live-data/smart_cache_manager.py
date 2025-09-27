#!/usr/bin/env python3
"""
Smart Cache Manager for ESPN Football Data (NFL and College Football)
Implements intelligent caching with game-specific updates for both sports
"""
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from col_full_test import scrape_comprehensive_boxscore, scrape_game_ids_from_scoreboard
from nfl_scraper import scrape_comprehensive_nfl_boxscore, scrape_nfl_game_ids_from_scoreboard
import re

class SmartESPNCacheManager:
    """
    Smart caching system that:
    1. Caches individual games with 2-minute expiry
    2. Full dataset refresh every 10 minutes
    3. Player-to-game mapping for targeted updates
    4. Supports both NFL and College Football
    """
    
    def __init__(self):
        # Individual game cache: {sport: {game_id: {'data': game_data, 'timestamp': datetime, 'metadata': metadata}}}
        self.game_cache: Dict[str, Dict[str, Dict]] = {
            'college': {},
            'nfl': {}
        }
        
        # Full dataset metadata per sport
        self.full_dataset_timestamp: Dict[str, Optional[datetime]] = {
            'college': None,
            'nfl': None
        }
        self.all_game_ids: Dict[str, Set[str]] = {
            'college': set(),
            'nfl': set()
        }
        
        # Cache duration settings
        self.individual_game_cache_minutes = 2
        self.full_dataset_cache_minutes = 10
        
        print("🧠 Smart ESPN Cache Manager initialized (NFL + College Football)")
    
    def is_individual_game_fresh(self, game_id: str, sport: str = 'college') -> bool:
        """Check if individual game cache is fresh (< 2 minutes)"""
        if sport not in self.game_cache or game_id not in self.game_cache[sport]:
            return False
        
        game_entry = self.game_cache[sport][game_id]
        if 'timestamp' not in game_entry:
            return False
        
        time_elapsed = datetime.now() - game_entry['timestamp']
        return time_elapsed < timedelta(minutes=self.individual_game_cache_minutes)
    
    def is_full_dataset_fresh(self, sport: str = 'college') -> bool:
        """Check if full dataset cache is fresh (< 10 minutes)"""
        if self.full_dataset_timestamp[sport] is None:
            return False
        
        time_elapsed = datetime.now() - self.full_dataset_timestamp[sport]
        return time_elapsed < timedelta(minutes=self.full_dataset_cache_minutes)
    
    def get_current_game_ids(self, sport: str = 'college') -> List[str]:
        """Get current game IDs from ESPN scoreboard"""
        try:
            if sport == 'nfl':
                game_ids = scrape_nfl_game_ids_from_scoreboard()
            else:
                game_ids = scrape_game_ids_from_scoreboard()
            return game_ids or []
        except Exception as e:
            print(f"⚠️  Error getting {sport} game IDs: {e}")
            return []
    
    def update_individual_game(self, game_id: str, sport: str = 'college') -> Optional[Dict]:
        """Update cache for a specific game by re-scraping that game's boxscore"""
        try:
            print(f"🎯 Re-scraping individual {sport} game: {game_id}")
            print(f"   📡 Fetching fresh data from ESPN for {sport} game {game_id}...")
            
            # Scrape only this specific game's boxscore
            if sport == 'nfl':
                game_data = scrape_comprehensive_nfl_boxscore(game_id)
            else:
                game_data = scrape_comprehensive_boxscore(game_id)
            
            if game_data:
                # Extract metadata (players and teams)
                metadata = self._extract_game_metadata(game_data)
                
                # Update cache with fresh data
                self.game_cache[sport][game_id] = {
                    'data': game_data,
                    'timestamp': datetime.now(),
                    'metadata': metadata
                }
                
                print(f"✅ {sport.title()} game {game_id} re-scraped and cached successfully")
                print(f"   📊 Teams: {', '.join(metadata.get('teams', []))}")
                print(f"   👥 Players: {len(metadata.get('players', []))} tracked")
                
                # Show game status if available
                status = metadata.get('status', {})
                if status.get('quarter') and status.get('time_remaining'):
                    print(f"   ⏱️  Status: {status['time_remaining']} left in {status['quarter']}")
                
                return game_data
            else:
                print(f"❌ Failed to re-scrape {sport} game {game_id} - ESPN returned no data")
                return None
                
        except Exception as e:
            print(f"❌ Error re-scraping {sport} game {game_id}: {e}")
            return None
    
    def full_refresh(self, sport: str = 'college') -> Dict[str, Any]:
        """Perform full dataset refresh for specified sport"""
        print(f"🔄 Performing full {sport} dataset refresh...")
        
        # Get current game IDs for the sport
        current_game_ids = self.get_current_game_ids(sport)
        if not current_game_ids:
            print(f"❌ No {sport} game IDs found")
            return {}
        
        print(f"📋 Found {len(current_game_ids)} {sport} games to refresh")
        
        # Update all games
        updated_games = {}
        for game_id in current_game_ids:
            game_data = self.update_individual_game(game_id, sport)
            if game_data:
                updated_games[game_id] = game_data
        
        # Update metadata
        self.all_game_ids[sport] = set(current_game_ids)
        self.full_dataset_timestamp[sport] = datetime.now()
        
        print(f"✅ Full {sport} refresh complete: {len(updated_games)} games updated")
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
    
    def find_games_by_query(self, query: str, sport: str = None) -> Dict[str, List[str]]:
        """Find games that match the query (teams or players) across sports"""
        query_lower = query.lower().strip()
        matching_games = {'college': [], 'nfl': []}
        
        # Search specified sport or all sports
        sports_to_search = [sport] if sport else ['college', 'nfl']
        
        for sport_key in sports_to_search:
            if sport_key not in self.game_cache:
                continue
                
            for game_id, game_entry in self.game_cache[sport_key].items():
                metadata = game_entry.get('metadata', {})
                
                # Check teams
                teams = metadata.get('teams', [])
                for team in teams:
                    if team.lower() in query_lower or query_lower in team.lower():
                        if game_id not in matching_games[sport_key]:
                            matching_games[sport_key].append(game_id)
                
                # Check players
                players = metadata.get('players', [])
                for player in players:
                    if player.lower() in query_lower or query_lower in player.lower():
                        if game_id not in matching_games[sport_key]:
                            matching_games[sport_key].append(game_id)
        
        return matching_games
    
    def get_smart_data(self, query_hint: str = "", sport: str = None) -> Dict[str, Any]:
        """
        Smart data retrieval based on query context
        
        Args:
            query_hint: User's query to help identify which games to prioritize
            sport: Specific sport to focus on ('college', 'nfl', or None for both)
        
        Returns:
            Complete dataset with smart caching
        """
        # Determine which sports to process
        sports_to_process = [sport] if sport else ['college', 'nfl']
        all_updated_games = {}
        
        for sport_key in sports_to_process:
            print(f"\n🏈 Processing {sport_key.upper()} data...")
            
            # Check if full dataset needs refresh for this sport
            if not self.is_full_dataset_fresh(sport_key):
                print(f"🔄 {sport_key.title()} dataset expired - performing full refresh")
                updated_games = self.full_refresh(sport_key)
                for game_id, game_data in updated_games.items():
                    all_updated_games[f"{sport_key}_{game_id}"] = game_data
            else:
                print(f"📋 {sport_key.title()} dataset is fresh")
            
            # Find games that match the query (teams or players)
            if query_hint:
                matching_games = self.find_games_by_query(query_hint, sport_key)
                sport_matches = matching_games.get(sport_key, [])
                print(f"🔍 Query '{query_hint}' matches {len(sport_matches)} {sport_key} games: {sport_matches}")
                
                # Update matching games if they're stale
                if sport_matches:
                    print(f"🎯 Found {len(sport_matches)} {sport_key} games matching query - checking freshness...")
                    for game_id in sport_matches:
                        if not self.is_individual_game_fresh(game_id, sport_key):
                            print(f"🔄 {sport_key.title()} game {game_id} is stale (>2 min) - re-scraping...")
                            updated_data = self.update_individual_game(game_id, sport_key)
                            if updated_data:
                                all_updated_games[f"{sport_key}_{game_id}"] = updated_data
                        else:
                            print(f"✅ {sport_key.title()} game {game_id} is fresh (<2 min) - using cached data")
            
            # If no specific matches, update a few stale games to keep data fresh
            if not query_hint or not matching_games.get(sport_key, []):
                print(f"🔍 Checking for any stale {sport_key} games to refresh...")
                stale_games = [game_id for game_id in self.game_cache[sport_key].keys() 
                              if not self.is_individual_game_fresh(game_id, sport_key)]
                if stale_games:
                    print(f"🔄 Found {len(stale_games)} stale {sport_key} games, re-scraping first 2...")
                    # Update a few stale games to keep data fresh
                    for game_id in stale_games[:2]:  # Limit to 2 per sport
                        updated_data = self.update_individual_game(game_id, sport_key)
                        if updated_data:
                            all_updated_games[f"{sport_key}_{game_id}"] = updated_data
                else:
                    print(f"✅ All {sport_key} games are fresh - no re-scraping needed")
        
        # Compile final dataset
        total_games = sum(len(self.game_cache[sport_key]) for sport_key in sports_to_process)
        final_dataset = {
            'scrape_timestamp': datetime.now().isoformat(),
            'total_games': total_games,
            'sports': sports_to_process,
            'games': {}
        }
        
        # Add all cached games from specified sports
        for sport_key in sports_to_process:
            for game_id, game_entry in self.game_cache[sport_key].items():
                if 'data' in game_entry:
                    final_dataset['games'][f"{sport_key}_{game_id}"] = game_entry['data']
        
        return final_dataset
    
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get current cache status for debugging"""
        # Count total players and teams across all games and sports
        total_players = set()
        total_teams = set()
        status = {
            'college': {
                'individual_games_cached': len(self.game_cache['college']),
                'full_dataset_fresh': self.is_full_dataset_fresh('college'),
                'full_dataset_age_minutes': (
                    (datetime.now() - self.full_dataset_timestamp['college']).total_seconds() / 60
                    if self.full_dataset_timestamp['college'] else None
                ),
                'fresh_games': sum(1 for game_id in self.game_cache['college'].keys() 
                                 if self.is_individual_game_fresh(game_id, 'college'))
            },
            'nfl': {
                'individual_games_cached': len(self.game_cache['nfl']),
                'full_dataset_fresh': self.is_full_dataset_fresh('nfl'),
                'full_dataset_age_minutes': (
                    (datetime.now() - self.full_dataset_timestamp['nfl']).total_seconds() / 60
                    if self.full_dataset_timestamp['nfl'] else None
                ),
                'fresh_games': sum(1 for game_id in self.game_cache['nfl'].keys() 
                                 if self.is_individual_game_fresh(game_id, 'nfl'))
            }
        }
        
        # Count players and teams across both sports
        for sport in ['college', 'nfl']:
            for game_entry in self.game_cache[sport].values():
                metadata = game_entry.get('metadata', {})
                total_players.update(metadata.get('players', []))
                total_teams.update(metadata.get('teams', []))
        
        status['combined'] = {
            'total_games_cached': len(self.game_cache['college']) + len(self.game_cache['nfl']),
            'total_players_tracked': len(total_players),
            'total_teams_tracked': len(total_teams),
            'fresh_games': status['college']['fresh_games'] + status['nfl']['fresh_games']
        }
        
        return status

# Global instance
smart_cache = SmartESPNCacheManager()

def get_smart_espn_data(query_hint: str = "", sport: str = None) -> Dict[str, Any]:
    """Main function to get ESPN data with smart caching"""
    return smart_cache.get_smart_data(query_hint, sport)

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
