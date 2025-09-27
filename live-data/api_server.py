#!/usr/bin/env python3
"""
NextGen Live Football Stats - API Server
Clean Flask API backend for football statistics
"""
import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from smart_cache_manager import get_smart_espn_data, smart_cache

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global chat session
chat_session = None

class NextGenChatSession:
    """NextGen Live Football Stats chat session with Gemini AI"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        
        # Initialize Gemini chat
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.chat = self.model.start_chat(history=[])
        
        print("🏈 NextGen Live Football Stats API initialized")
    
    def get_response(self, user_input: str) -> dict:
        """Get AI response for user input"""
        try:
            # Handle special commands
            if user_input.lower() == 'refresh':
                # Clear smart cache
                smart_cache.game_cache.clear()
                smart_cache.full_dataset_timestamp = None
                smart_cache.all_game_ids.clear()
                return {
                    'success': True,
                    'response': "🔄 Cache refreshed - fetching fresh data on next query",
                    'timestamp': datetime.now().isoformat()
                }
            
            # Get smart ESPN data with query context
            scraped_data = get_smart_espn_data(query_hint=user_input)
            
            # Check if ESPN data retrieval failed
            if not scraped_data or not scraped_data.get('games'):
                return {
                    'success': False,
                    'error': 'Unable to retrieve football data from ESPN',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Send full raw data to Gemini with context
            prompt = f"""
            You are NextGen Live Football Stats AI assistant. Use the following current ESPN college football data to answer the user's question.
            
            Current Football Data:
            {scraped_data}
            
            User Question: {user_input}
            
            Please provide a helpful, informative response based on the current data. You have access to detailed player statistics, live game scores, and team information. Keep it conversational and engaging. Focus on the most relevant and exciting information.
            """
            
            response = self.chat.send_message(prompt)
            
            # Create status message with smart cache info
            games_count = scraped_data.get('total_games', 0)
            cache_status = smart_cache.get_cache_status()
            fresh_games = cache_status.get('fresh_games', 0)
            status_msg = f"✅ {games_count} games tracked ({fresh_games} fresh)"
            
            return {
                'success': True,
                'response': response.text,
                'stats': {
                    'games_tracked': games_count,
                    'fresh_games': fresh_games,
                    'total_players': cache_status.get('total_players_tracked', 0),
                    'total_teams': cache_status.get('total_teams_tracked', 0)
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
        'service': 'NextGen Live Football Stats API',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
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
        if not message:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400
        
        response = chat_session.get_response(message)
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
            'service': 'NextGen Live Football Stats',
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
    """Clear the smart cache"""
    try:
        smart_cache.game_cache.clear()
        smart_cache.full_dataset_timestamp = None
        smart_cache.all_game_ids.clear()
        
        return jsonify({
            'success': True,
            'message': 'Cache cleared successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Cache clear error: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'API endpoint not found',
        'available_endpoints': [
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
    
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment")
        print("   Please set your API key: export GEMINI_API_KEY=your_key_here")
        return
    
    # Initialize chat session
    chat_session = NextGenChatSession(gemini_api_key)
    
    print("🚀 Starting NextGen Live Football Stats API Server...")
    print("   API available at: http://localhost:5001")
    print("   Endpoints:")
    print("     GET  /api/health      - Health check")
    print("     POST /api/chat        - Chat with AI")
    print("     GET  /api/stats       - System statistics")
    print("     POST /api/cache/clear - Clear cache")
    
    app.run(host='0.0.0.0', port=5001, debug=False)

if __name__ == "__main__":
    main()
