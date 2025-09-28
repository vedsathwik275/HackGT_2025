#!/usr/bin/env python3
"""
NextGen Live Football Stats - API Server
Clean Flask API backend for both NFL and College Football statistics
"""
import os
import json
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
        self.model = "gpt-5-nano-2025-08-07"
        self.conversation_history = []
        
        print("🏈 NextGen Live Football Stats API initialized with OpenAI GPT-5-nano (NFL + College Football)")
    
    def get_response(self, user_input: str, sport: str = None) -> dict:
        """Get AI response for user input with sport selection"""
        try:
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
            scraped_data = get_smart_espn_data(query_hint=user_input, sport=sport)
            
            # Check if ESPN data retrieval failed
            if not scraped_data or not scraped_data.get('games'):
                return {
                    'success': False,
                    'error': 'Unable to retrieve football data from ESPN',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Determine sports included in data
            sports_included = scraped_data.get('sports', ['college'])
            sport_description = ' and '.join([s.title() for s in sports_included])
            
            # Send full raw data to OpenAI with context
            system_message = "You are NextGen Live Football Stats AI assistant. Use the provided current ESPN football data to answer user questions. Keep responses conversational and engaging, focusing on the most relevant and exciting information. If data includes both NFL and College Football, make it clear which sport you're referring to in your response."
            
            user_message = f"""
            Current Football Data ({sport_description}):
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
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_completion_tokens=4096
            )
            
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
            
            return {
                'success': True,
                'response': response.choices[0].message.content,
                'stats': {
                    'games_tracked': games_count,
                    'fresh_games': fresh_games,
                    'total_players': combined_stats.get('total_players_tracked', 0),
                    'total_teams': combined_stats.get('total_teams_tracked', 0),
                    'sports_included': sports_included
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"AI processing error: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'NextGen Live Football Stats API (NFL + College)',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint with sport selection"""
    global chat_session
    
    if not chat_session:
        return jsonify({
            'success': False,
            'error': 'AI chat session not initialized'
        }), 500
    
    try:
        data = request.json
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        message = data.get('message', '').strip()
        sport = data.get('sport', None)  # Optional sport parameter
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400
        
        response = chat_session.get_response(message, sport)
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get current system statistics"""
    global chat_session
    
    if not chat_session:
        return jsonify({'error': 'Service not initialized'}), 500
    
    try:
        # Get smart cache status
        cache_status = smart_cache.get_cache_status()
        
        return jsonify({
            'service': 'NextGen Live Football Stats (NFL + College)',
            'status': 'active',
            'cache': cache_status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Stats error: {str(e)}'
        }), 500

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear the smart cache for both sports"""
    try:
        smart_cache.game_cache['college'].clear()
        smart_cache.game_cache['nfl'].clear()
        smart_cache.full_dataset_timestamp['college'] = None
        smart_cache.full_dataset_timestamp['nfl'] = None
        smart_cache.all_game_ids['college'].clear()
        smart_cache.all_game_ids['nfl'].clear()
        
        return jsonify({
            'success': True,
            'message': 'Cache cleared successfully for both NFL and College Football',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Cache clear error: {str(e)}'
        }), 500

# API-only root route
@app.route('/')
def api_info():
    """API information endpoint"""
    return jsonify({
        'service': 'NextGen Live Football Stats API',
        'version': '1.0.0',
        'description': 'Real-time NFL and College Football statistics with AI-powered insights',
        'endpoints': {
            'health': '/api/health',
            'chat': '/api/chat (POST)',
            'stats': '/api/stats',
            'cache_clear': '/api/cache/clear (POST)'
        },
        'documentation': 'https://github.com/your-repo/live-data',
        'status': 'running'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'available_endpoints': [
            '/',
            '/api/health',
            '/api/chat',
            '/api/stats',
            '/api/cache/clear'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
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
    print("     GET  /api/health      - Health check")
    print("     POST /api/chat        - Chat with AI (supports sport parameter)")
    print("     GET  /api/stats       - System statistics")
    print("     POST /api/cache/clear - Clear cache")
    
    # Use PORT environment variable for deployment platforms
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == "__main__":
    main()
