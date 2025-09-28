#!/usr/bin/env python3
"""
NextGen Live Football Stats - API Server
Clean Flask API backend for both NFL and College Football statistics
"""
import os
import json
import time
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from smart_cache_manager import get_smart_espn_data, smart_cache

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global chat session
chat_session = None

class NextGenChatSession:
    """NextGen Live Football Stats chat session with OpenAI GPT-5-nano (NFL + College)"""
    
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        
        # Initialize OpenAI client
        self.client = OpenAI(api_key=openai_api_key)
        self.model = "gpt-5-mini-2025-08-07"
        self.conversation_history = []
        
        print("🏈 NextGen Live Football Stats API initialized with OpenAI GPT-5-nano (NFL + College Football)")
    
    def _filter_query_relevant_data(self, scraped_data: dict, user_input: str, sport: str = None) -> dict:
        """Filter scraped data to only include games relevant to the user's query"""
        
        # Use smart cache to find games that match the query
        matching_games = smart_cache.find_games_by_query(user_input, sport)
        
        # Count total matching games across sports
        total_matches = sum(len(games) for games in matching_games.values())
        
        if total_matches == 0:
            print(f"🔍 DEBUG: No specific game matches found for query, using all games")
            return scraped_data
        
        print(f"🎯 DEBUG: Found {total_matches} games matching query: {matching_games}")
        
        # Create filtered dataset with only matching games
        filtered_games = {}
        sports_included = []
        
        for sport_key, game_ids in matching_games.items():
            if game_ids:  # Only include sports that have matching games
                sports_included.append(sport_key)
                for game_id in game_ids:
                    game_key = f"{sport_key}_{game_id}"
                    if game_key in scraped_data.get('games', {}):
                        filtered_games[game_key] = scraped_data['games'][game_key]
        
        # If we found specific matches, return filtered data
        if filtered_games:
            filtered_data = scraped_data.copy()
            filtered_data['games'] = filtered_games
            filtered_data['total_games'] = len(filtered_games)
            filtered_data['sports'] = sports_included
            filtered_data['filtered'] = True  # Flag to indicate this is filtered data
            return filtered_data
        
        # Fallback to original data if filtering didn't work
        return scraped_data
    
    def get_defensive_coaching_response(self, user_input: str, player_coordinates: dict) -> dict:
        """Get AI response for defensive coaching with player coordinates"""
        try:
            total_start_time = time.time()
            print(f"🏈 DEBUG: Processing defensive coaching query: '{user_input}'")
            print(f"🏈 DEBUG: Player coordinates data size: {len(str(player_coordinates))} chars")
            
            # Create system message for defensive coaching
            system_message = """You are an elite American football defensive coach with decades of experience analyzing defensive coverage and player positioning. You have access to real-time player coordinates with x,y coordinates and yards relative to the line of scrimmage.

EXPERTISE AREAS:
- Defensive coverage schemes (Cover 1, Cover 2, Cover 3, Cover 4, Cover 6, etc.)
- Zone vs Man coverage identification
- Blitz packages and pass rush schemes
- Run defense alignments and gap responsibilities
- Player positioning and leverage analysis
- Coverage weaknesses and exploitable areas
- Defensive adjustments and audibles

DATA YOU HAVE ACCESS TO:
- Player coordinates: x,y positions on the field
- Yard markers relative to line of scrimmage
- Player positioning and alignment data
- Field positioning context

RESPONSE GUIDELINES:
- Analyze defensive formations and coverage based on player positions
- Identify potential weaknesses or strengths in the alignment
- Suggest coaching adjustments or strategic insights
- Use proper football terminology and concepts
- Be specific about player positioning and responsibilities
- Provide actionable defensive coaching advice
- Consider down and distance context when available"""

            user_message = f"""
Player Coordinate Data:
{json.dumps(player_coordinates, indent=2)}

Coaching Question: {user_input}

Please analyze the defensive positioning and provide expert coaching insights based on the player coordinates and formation shown.
"""

            # Create messages for OpenAI API
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ]
            
            # Calculate input sizes for tracking
            total_input_size = len(system_message) + len(user_message)
            coordinates_size = len(str(player_coordinates))
            
            print(f"🏈 DEBUG: OpenAI API Call Details:")
            print(f"🏈 DEBUG: - Model: {self.model}")
            print(f"🏈 DEBUG: - System message: {len(system_message):,} chars")
            print(f"🏈 DEBUG: - User message: {len(user_message):,} chars")
            print(f"🏈 DEBUG: - Coordinates data: {coordinates_size:,} chars")
            print(f"🏈 DEBUG: - Total input size: {total_input_size:,} chars ({total_input_size/1024:.1f} KB)")
            
            print(f"🏈 DEBUG: Making OpenAI API call for defensive coaching...")
            openai_start_time = time.time()
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_completion_tokens=1000
            )
            openai_duration = time.time() - openai_start_time
            
            print(f"🏈 DEBUG: OpenAI response received in {openai_duration:.2f}s")
            
            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                print(f"🏈 DEBUG: Response content length: {len(content) if content else 0} chars")
            else:
                print(f"🏈 DEBUG: No response choices found!")
                return {
                    'success': False,
                    'error': 'No response received from AI',
                    'timestamp': datetime.now().isoformat()
                }
            
            final_response = response.choices[0].message.content
            total_duration = time.time() - total_start_time
            
            print(f"🏈 DEBUG: Defensive coaching response completed in {total_duration:.2f}s")
            
            return {
                'success': True,
                'response': final_response,
                'stats': {
                    'coordinates_processed': len(player_coordinates.get('players', [])) if isinstance(player_coordinates.get('players'), list) else 0,
                    'timing': {
                        'total_duration': round(total_duration, 2),
                        'openai_duration': round(openai_duration, 2)
                    }
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"🏈 DEBUG: Exception in defensive coaching: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': f"Defensive coaching error: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }

    def get_response(self, user_input: str, sport: str = None) -> dict:
        """Get AI response for user input with sport selection"""
        try:
            total_start_time = time.time()
            print(f"🔍 DEBUG: Processing user input: '{user_input}'")
            print(f"🔍 DEBUG: Sport filter: {sport}")
            
            # Handle special commands
            if user_input.lower() == 'refresh':
                # Clear smart cache for both sports
                smart_cache.game_cache['college'].clear()
                smart_cache.game_cache['nfl'].clear()
                smart_cache.full_dataset_timestamp['college'] = None
                smart_cache.full_dataset_timestamp['nfl'] = None
                smart_cache.all_game_ids['college'].clear()
                smart_cache.all_game_ids['nfl'].clear()
                return {
                    'success': True,
                    'response': "🔄 Cache refreshed for both NFL and College Football - fetching fresh data on next query",
                    'timestamp': datetime.now().isoformat()
                }
            
            # Determine sport from query if not specified
            if not sport:
                user_lower = user_input.lower()
                if 'nfl' in user_lower or 'professional' in user_lower:
                    sport = 'nfl'
                elif 'college' in user_lower or 'ncaa' in user_lower:
                    sport = 'college'
                # If no sport specified, get both
            
            # Get smart ESPN data with query context and sport preference
            print(f"🔍 DEBUG: Fetching ESPN data...")
            espn_start_time = time.time()
            scraped_data = get_smart_espn_data(query_hint=user_input, sport=sport)
            espn_duration = time.time() - espn_start_time
            print(f"🔍 DEBUG: ESPN data retrieved in {espn_duration:.2f}s - Total games: {scraped_data.get('total_games', 0) if scraped_data else 0}")
            
            # Check if ESPN data retrieval failed
            if not scraped_data or not scraped_data.get('games'):
                print(f"🔍 DEBUG: ESPN data retrieval failed - scraped_data: {bool(scraped_data)}")
                return {
                    'success': False,
                    'error': 'Unable to retrieve football data from ESPN',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Filter data to only query-relevant games if specific matches found
            original_game_count = len(scraped_data.get('games', {}))
            filtered_data = self._filter_query_relevant_data(scraped_data, user_input, sport)
            filtered_game_count = len(filtered_data.get('games', {}))
            
            print(f"🔍 DEBUG: Data filtering - Original: {original_game_count} games, Filtered: {filtered_game_count} games")
            if filtered_game_count < original_game_count:
                print(f"🎯 DEBUG: Using filtered dataset ({filtered_game_count} games) for faster LLM response")
                scraped_data = filtered_data
            
            # Determine sports included in data
            sports_included = scraped_data.get('sports', ['college'])
            sport_description = ' and '.join([s.title() for s in sports_included])
            
            # Send filtered data to OpenAI with context
            is_filtered = scraped_data.get('filtered', False)
            data_context = "filtered data focused on your query" if is_filtered else "comprehensive data"
            
            system_message = f"""You are NextGen Live Football Stats AI assistant, an expert in analyzing real-time football data.

DATA STRUCTURE YOU'RE WORKING WITH:
- Source: ESPN live sports data ({data_context})
- Sports: {sport_description}
- Total Games: {scraped_data.get('total_games', 0)}
- Data Freshness: Real-time with smart caching (2-10 minute intervals)

AVAILABLE DATA FIELDS:
1. Game Info: team names, scores, game status, quarter/time remaining
2. Quarter Scores: breakdown by quarter for each team  
3. Player Statistics: organized by statistical categories (passing, rushing, receiving, defense, etc.)
4. Team Totals: aggregate team statistics per category
5. Player Details: names, jersey numbers, player IDs, individual stat lines

DATA FORMAT STRUCTURE:
- games: Dict with game_id keys containing full game data
- Each game has: game_info (teams, status, scores) and teams (player stats by category)
- Player stats include: name, jersey, stats dict with specific metrics
- Team totals provide aggregate numbers for each statistical category

RESPONSE GUIDELINES:
- Be conversational and engaging while being factually accurate
- Always specify which sport (NFL/College) when data includes both
- Focus on the most relevant and exciting information for the query
- Use specific numbers, player names, and team names from the data
- If data is filtered, you're seeing only games relevant to the user's query
- When comparing players or teams, use actual statistical data provided
- Format statistics clearly (e.g., "245 passing yards, 3 TDs, 1 INT")"""
            
            user_message = f"""
            Current Football Data ({sport_description}) - {scraped_data.get('total_games', 0)} games:
            {scraped_data}
            
            User Question: {user_input}
            
            Please provide a helpful, informative response based on the current data. You have access to detailed player statistics, live game scores, and team information from {sport_description}.
            """
            
            # Add to conversation history
            messages = [
                {"role": "system", "content": system_message},
                *self.conversation_history,
                {"role": "user", "content": user_message}
            ]
            
            # Calculate data sizes for comprehensive tracking
            scraped_data_size = len(str(scraped_data))
            total_input_size = len(system_message) + len(user_message)
            
            print(f"🔍 DEBUG: ESPN Data Analysis:")
            print(f"🔍 DEBUG: - Raw scraped data size: {scraped_data_size:,} chars ({scraped_data_size/1024:.1f} KB)")
            print(f"🔍 DEBUG: - Games in dataset: {scraped_data.get('total_games', 0)}")
            print(f"🔍 DEBUG: - Sports included: {scraped_data.get('sports', [])}")
            print(f"🔍 DEBUG: - Data is filtered: {scraped_data.get('filtered', False)}")
            
            print(f"🔍 DEBUG: OpenAI API Call Details:")
            print(f"🔍 DEBUG: - Model: {self.model}")
            print(f"🔍 DEBUG: - Total messages: {len(messages)}")
            print(f"🔍 DEBUG: - System message: {len(system_message):,} chars")
            print(f"🔍 DEBUG: - User message: {len(user_message):,} chars ({len(user_message)/1024:.1f} KB)")
            print(f"🔍 DEBUG: - Total input size: {total_input_size:,} chars ({total_input_size/1024:.1f} KB)")
            print(f"🔍 DEBUG: - Conversation history: {len(self.conversation_history)} messages")
            
            print(f"🔍 DEBUG: Making OpenAI API call...")
            openai_start_time = time.time()
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_completion_tokens=1500
            )
            openai_duration = time.time() - openai_start_time
            
            print(f"🔍 DEBUG: OpenAI response received in {openai_duration:.2f}s")
            print(f"🔍 DEBUG: Response choices count: {len(response.choices) if response.choices else 0}")
            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                print(f"🔍 DEBUG: Response content length: {len(content) if content else 0} chars")
                print(f"🔍 DEBUG: Response content preview: {content[:100] if content else 'NONE'}...")
            else:
                print(f"🔍 DEBUG: No response choices found!")
                print(f"🔍 DEBUG: Full response object: {response}")
            
            # Update conversation history (keep last 10 exchanges)
            self.conversation_history.append({"role": "user", "content": user_input})
            self.conversation_history.append({"role": "assistant", "content": response.choices[0].message.content})
            if len(self.conversation_history) > 20:  # Keep last 10 exchanges (20 messages)
                self.conversation_history = self.conversation_history[-20:]
            
            # Create status message with smart cache info
            games_count = scraped_data.get('total_games', 0)
            cache_status = smart_cache.get_cache_status()
            combined_stats = cache_status.get('combined', {})
            fresh_games = combined_stats.get('fresh_games', 0)
            status_msg = f"✅ {games_count} games tracked ({fresh_games} fresh) - {sport_description}"
            
            final_response = response.choices[0].message.content if response.choices else ""
            total_duration = time.time() - total_start_time
            
            print(f"🔍 DEBUG: Final response being returned: {len(final_response)} chars")
            print(f"🔍 DEBUG: Total request processing time: {total_duration:.2f}s")
            print(f"🔍 DEBUG: Timing breakdown - ESPN: {espn_duration:.2f}s, OpenAI: {openai_duration:.2f}s, Other: {(total_duration - espn_duration - openai_duration):.2f}s")
            
            return {
                'success': True,
                'response': final_response,
                'stats': {
                    'games_tracked': games_count,
                    'fresh_games': fresh_games,
                    'total_players': combined_stats.get('total_players_tracked', 0),
                    'total_teams': combined_stats.get('total_teams_tracked', 0),
                    'sports_included': sports_included,
                    'timing': {
                        'total_duration': round(total_duration, 2),
                        'espn_duration': round(espn_duration, 2),
                        'openai_duration': round(openai_duration, 2)
                    }
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"🔍 DEBUG: Exception caught in get_response: {str(e)}")
            print(f"🔍 DEBUG: Exception type: {type(e)}")
            import traceback
            print(f"🔍 DEBUG: Full traceback:")
            traceback.print_exc()
            return {
                'success': False,
                'error': f"AI processing error: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    print(f"🔍 DEBUG: Health check endpoint called")
    print(f"🔍 DEBUG: Chat session initialized: {chat_session is not None}")
    
    if chat_session:
        cache_status = smart_cache.get_cache_status()
        combined_stats = cache_status.get('combined', {})
        print(f"🔍 DEBUG: Cache status - Games: {combined_stats.get('total_games_cached', 0)}, Players: {combined_stats.get('total_players_tracked', 0)}")
    
    return jsonify({
        'status': 'healthy',
        'service': 'NextGen Live Football Stats API (NFL + College)',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint with sport selection"""
    global chat_session
    
    print(f"🔍 DEBUG: /api/chat endpoint called")
    print(f"🔍 DEBUG: Request method: {request.method}")
    print(f"🔍 DEBUG: Request headers: {dict(request.headers)}")
    
    if not chat_session:
        print(f"🔍 DEBUG: Chat session not initialized!")
        return jsonify({
            'success': False,
            'error': 'AI chat session not initialized'
        }), 500
    
    try:
        data = request.json
        print(f"🔍 DEBUG: Request JSON data: {data}")
        
        if not data:
            print(f"🔍 DEBUG: No JSON data provided in request")
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        message = data.get('message', '').strip()
        sport = data.get('sport', None)  # Optional sport parameter
        
        print(f"🔍 DEBUG: Extracted message: '{message}'")
        print(f"🔍 DEBUG: Extracted sport filter: {sport}")
        
        if not message:
            print(f"🔍 DEBUG: Empty message provided")
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400
        
        print(f"🔍 DEBUG: Calling chat_session.get_response() with message length: {len(message)} chars")
        response = chat_session.get_response(message, sport)
        
        print(f"🔍 DEBUG: Response received from chat_session")
        print(f"🔍 DEBUG: Response success: {response.get('success', False)}")
        print(f"🔍 DEBUG: Response length: {len(response.get('response', '')) if response.get('response') else 0} chars")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"🔍 DEBUG: Exception in /api/chat endpoint: {str(e)}")
        import traceback
        print(f"🔍 DEBUG: Full traceback:")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get current system statistics"""
    global chat_session
    
    print(f"🔍 DEBUG: /api/stats endpoint called")
    
    if not chat_session:
        print(f"🔍 DEBUG: Chat session not initialized for stats endpoint")
        return jsonify({'error': 'Service not initialized'}), 500
    
    try:
        print(f"🔍 DEBUG: Getting smart cache status...")
        # Get smart cache status
        cache_status = smart_cache.get_cache_status()
        
        # Log detailed cache information
        combined_stats = cache_status.get('combined', {})
        college_stats = cache_status.get('college', {})
        nfl_stats = cache_status.get('nfl', {})
        
        print(f"🔍 DEBUG: Cache stats - Total games: {combined_stats.get('total_games_cached', 0)}")
        print(f"🔍 DEBUG: Cache stats - Total players: {combined_stats.get('total_players_tracked', 0)}")
        print(f"🔍 DEBUG: Cache stats - Total teams: {combined_stats.get('total_teams_tracked', 0)}")
        print(f"🔍 DEBUG: Cache stats - College games: {college_stats.get('individual_games_cached', 0)}")
        print(f"🔍 DEBUG: Cache stats - NFL games: {nfl_stats.get('individual_games_cached', 0)}")
        print(f"🔍 DEBUG: Cache stats - College fresh games: {college_stats.get('fresh_games', 0)}")
        print(f"🔍 DEBUG: Cache stats - NFL fresh games: {nfl_stats.get('fresh_games', 0)}")
        
        response_data = {
            'service': 'NextGen Live Football Stats (NFL + College)',
            'status': 'active',
            'cache': cache_status,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"🔍 DEBUG: Stats response prepared, size: {len(str(response_data))} chars")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"🔍 DEBUG: Exception in /api/stats endpoint: {str(e)}")
        import traceback
        print(f"🔍 DEBUG: Full traceback:")
        traceback.print_exc()
        return jsonify({
            'error': f'Stats error: {str(e)}'
        }), 500

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear the smart cache for both sports"""
    print(f"🔍 DEBUG: /api/cache/clear endpoint called")
    
    try:
        # Log cache status before clearing
        cache_status_before = smart_cache.get_cache_status()
        combined_before = cache_status_before.get('combined', {})
        print(f"🔍 DEBUG: Cache before clear - Games: {combined_before.get('total_games_cached', 0)}, Players: {combined_before.get('total_players_tracked', 0)}")
        
        print(f"🔍 DEBUG: Clearing college cache...")
        smart_cache.game_cache['college'].clear()
        smart_cache.full_dataset_timestamp['college'] = None
        smart_cache.all_game_ids['college'].clear()
        
        print(f"🔍 DEBUG: Clearing NFL cache...")
        smart_cache.game_cache['nfl'].clear()
        smart_cache.full_dataset_timestamp['nfl'] = None
        smart_cache.all_game_ids['nfl'].clear()
        
        # Log cache status after clearing
        cache_status_after = smart_cache.get_cache_status()
        combined_after = cache_status_after.get('combined', {})
        print(f"🔍 DEBUG: Cache after clear - Games: {combined_after.get('total_games_cached', 0)}, Players: {combined_after.get('total_players_tracked', 0)}")
        
        response_data = {
            'success': True,
            'message': 'Cache cleared successfully for both NFL and College Football',
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"🔍 DEBUG: Cache clear successful")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"🔍 DEBUG: Exception in /api/cache/clear endpoint: {str(e)}")
        import traceback
        print(f"🔍 DEBUG: Full traceback:")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Cache clear error: {str(e)}'
        }), 500

@app.route('/api/defensive-coach', methods=['POST'])
def defensive_coach():
    """Defensive coaching endpoint with player coordinates analysis"""
    global chat_session
    
    print(f"🏈 DEBUG: /api/defensive-coach endpoint called")
    print(f"🏈 DEBUG: Request method: {request.method}")
    print(f"🏈 DEBUG: Request headers: {dict(request.headers)}")
    
    if not chat_session:
        print(f"🏈 DEBUG: Chat session not initialized!")
        return jsonify({
            'success': False,
            'error': 'AI chat session not initialized'
        }), 500
    
    try:
        data = request.json
        print(f"🏈 DEBUG: Request JSON data keys: {list(data.keys()) if data else 'None'}")
        
        if not data:
            print(f"🏈 DEBUG: No JSON data provided in request")
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        message = data.get('message', '').strip()
        player_coordinates = data.get('coordinates', {})
        
        print(f"🏈 DEBUG: Extracted message: '{message}'")
        print(f"🏈 DEBUG: Coordinates data size: {len(str(player_coordinates))} chars")
        
        if not message:
            print(f"🏈 DEBUG: Empty message provided")
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400
        
        if not player_coordinates:
            print(f"🏈 DEBUG: No player coordinates provided")
            return jsonify({
                'success': False,
                'error': 'No player coordinates provided'
            }), 400
        
        print(f"🏈 DEBUG: Calling defensive coaching analysis...")
        response = chat_session.get_defensive_coaching_response(message, player_coordinates)
        
        print(f"🏈 DEBUG: Defensive coaching response received")
        print(f"🏈 DEBUG: Response success: {response.get('success', False)}")
        print(f"🏈 DEBUG: Response length: {len(response.get('response', '')) if response.get('response') else 0} chars")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"🏈 DEBUG: Exception in /api/defensive-coach endpoint: {str(e)}")
        import traceback
        print(f"🏈 DEBUG: Full traceback:")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

# API-only root route
@app.route('/')
def api_info():
    """API information endpoint"""
    print(f"🔍 DEBUG: Root endpoint (/) called")
    print(f"🔍 DEBUG: Chat session status: {chat_session is not None}")
    
    return jsonify({
        'service': 'NextGen Live Football Stats API',
        'version': '1.0.0',
        'description': 'Real-time NFL and College Football statistics with AI-powered insights',
        'endpoints': {
            'health': '/api/health',
            'chat': '/api/chat (POST)',
            'defensive_coach': '/api/defensive-coach (POST)',
            'stats': '/api/stats',
            'cache_clear': '/api/cache/clear (POST)'
        },
        'documentation': 'https://github.com/your-repo/live-data',
        'status': 'running'
    })

@app.errorhandler(404)
def not_found(error):
    print(f"🔍 DEBUG: 404 error - Endpoint not found: {request.url}")
    print(f"🔍 DEBUG: Request method: {request.method}")
    print(f"🔍 DEBUG: Request path: {request.path}")
    
    return jsonify({
        'error': 'Endpoint not found',
        'available_endpoints': [
            '/',
            '/api/health',
            '/api/chat',
            '/api/defensive-coach',
            '/api/stats',
            '/api/cache/clear'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    print(f"🔍 DEBUG: 500 internal server error: {str(error)}")
    print(f"🔍 DEBUG: Request URL: {request.url}")
    print(f"🔍 DEBUG: Request method: {request.method}")
    import traceback
    print(f"🔍 DEBUG: Full traceback:")
    traceback.print_exc()
    
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong on our end'
    }), 500

def main():
    """Initialize and start the API server"""
    global chat_session
    
    load_dotenv()
    
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        print("❌ Error: OPENAI_API_KEY not found in environment")
        print("   Please set your API key: export OPENAI_API_KEY=your_key_here")
        return
    
    # Initialize chat session
    chat_session = NextGenChatSession(openai_api_key)
    
    print("🚀 Starting NextGen Live Football Stats API Server...")
    print("   🏈 Supports both NFL and College Football")
    print("   API available at: http://localhost:5001")
    print("   Endpoints:")
    print("     GET  /api/health         - Health check")
    print("     POST /api/chat           - Chat with AI (supports sport parameter)")
    print("     POST /api/defensive-coach - Defensive coaching analysis with coordinates")
    print("     GET  /api/stats          - System statistics")
    print("     POST /api/cache/clear    - Clear cache")
    
    # Use PORT environment variable for deployment platforms
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == "__main__":
    main()
