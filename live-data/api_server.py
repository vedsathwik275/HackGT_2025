#!/usr/bin/env python3
"""
NextGen Live Football Stats - API Server
Clean Flask API backend for both NFL and College Football statistics
"""
import os
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from smart_cache_manager import get_smart_espn_data, smart_cache

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global chat session
chat_session = None

class NextGenChatSession:
    """NextGen Live Football Stats chat session with Gemini AI (NFL + College)"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        
        # Initialize Gemini chat
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.chat = self.model.start_chat(history=[])
        
        print("🏈 NextGen Live Football Stats API initialized (NFL + College Football)")
    
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
            
            # Send full raw data to Gemini with context
            prompt = f"""
            You are NextGen Live Football Stats AI assistant. Use the following current ESPN football data to answer the user's question.
            
            Current Football Data ({sport_description}):
            {scraped_data}
            
            User Question: {user_input}
            
            Please provide a helpful, informative response based on the current data. You have access to detailed player statistics, live game scores, and team information from {sport_description}. Keep it conversational and engaging. Focus on the most relevant and exciting information. If the data includes both NFL and College Football, make it clear which sport you're referring to in your response.
            """
            
            response = self.chat.send_message(prompt)
            
            # Create status message with smart cache info
            games_count = scraped_data.get('total_games', 0)
            cache_status = smart_cache.get_cache_status()
            combined_stats = cache_status.get('combined', {})
            fresh_games = combined_stats.get('fresh_games', 0)
            status_msg = f"✅ {games_count} games tracked ({fresh_games} fresh) - {sport_description}"
            
            return {
                'success': True,
                'response': response.text,
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

# Static file serving routes for frontend
@app.route('/')
def serve_frontend():
    """Serve the main frontend HTML file"""
    return send_file('frontend/index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    """Serve static files from frontend directory"""
    try:
        return send_from_directory('frontend', path)
    except:
        # If file not found, serve index.html for SPA routing
        return send_file('frontend/index.html')

@app.errorhandler(404)
def not_found(error):
    # For API routes, return JSON error
    if request.path.startswith('/api/'):
        return jsonify({
            'error': 'API endpoint not found',
            'available_endpoints': [
                '/api/health',
                '/api/chat',
                '/api/stats',
                '/api/cache/clear'
            ]
        }), 404
    # For other routes, serve the frontend
    else:
        return send_file('frontend/index.html')

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
    
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment")
        print("   Please set your API key: export GEMINI_API_KEY=your_key_here")
        return
    
    # Initialize chat session
    chat_session = NextGenChatSession(gemini_api_key)
    
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
