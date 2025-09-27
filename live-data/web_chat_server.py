#!/usr/bin/env python3
"""
Web-based streaming chat server for ESPN College Football + Gemini
Maintains persistent connection and caches ESPN data for 7 minutes
"""
import os
import json
import time
from datetime import datetime
from flask import Flask, render_template_string, request, Response, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from espn_langchain_tool import create_espn_tool
from smart_cache_manager import get_smart_espn_data, smart_cache

app = Flask(__name__)
CORS(app)

# Global chat session
chat_session = None
espn_tool = None

class WebESPNChatSession:
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.espn_tool = create_espn_tool(gemini_api_key=gemini_api_key)
        
        # Initialize Gemini chat
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.chat = self.model.start_chat(history=[])
        
        print("🏈 Web ESPN Chat Session initialized")
    
    def get_response(self, user_input: str) -> dict:
        """Get response for user input"""
        try:
            # Handle special commands
            if user_input.lower() == 'refresh':
                # Clear smart cache
                smart_cache.game_cache.clear()
                smart_cache.full_dataset_timestamp = None
                smart_cache.all_game_ids.clear()
                return {
                    'success': True,
                    'response': "🔄 Smart cache cleared - next query will fetch fresh data",
                    'timestamp': datetime.now().isoformat()
                }
            
            # Get smart ESPN data with query context
            scraped_data = get_smart_espn_data(query_hint=user_input)
            
            # Check if ESPN data retrieval failed
            if not scraped_data or not scraped_data.get('games'):
                return {
                    'success': False,
                    'error': 'Unable to retrieve ESPN data',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Send full raw data to Gemini with context
            prompt = f"""
            You are a college football expert assistant. Use the following current ESPN data to answer the user's question.
            
            Current ESPN Data:
            {scraped_data}
            
            User Question: {user_input}
            
            Please provide a helpful, informative response based on the current data. You have access to detailed player statistics, game scores, and team information. Keep it conversational and engaging.
            """
            
            response = self.chat.send_message(prompt)
            
            # Create status message with smart cache info
            games_count = scraped_data.get('total_games', 0)
            cache_status = smart_cache.get_cache_status()
            fresh_games = cache_status.get('fresh_games', 0)
            status_msg = f"✅ Got {games_count} games ({fresh_games} fresh, smart cache active)"
            
            return {
                'success': True,
                'response': response.text,
                'espn_status': status_msg,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏈 ESPN College Football Chat</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px; margin: 0 auto; padding: 20px; 
            background: #f5f5f5;
        }
        .container { 
            background: white; border-radius: 12px; padding: 20px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; border-bottom: 2px solid #e0e0e0; 
            padding-bottom: 15px; margin-bottom: 20px;
        }
        .chat-container { 
            height: 400px; overflow-y: auto; 
            border: 1px solid #ddd; border-radius: 8px; 
            padding: 15px; background: #fafafa; margin-bottom: 15px;
        }
        .message { 
            margin-bottom: 15px; padding: 10px; border-radius: 8px;
        }
        .user-message { 
            background: #007bff; color: white; margin-left: 20%;
        }
        .assistant-message { 
            background: #e9ecef; margin-right: 20%;
        }
        .status { 
            font-size: 0.8em; color: #666; margin-bottom: 5px;
        }
        .input-container { 
            display: flex; gap: 10px;
        }
        input[type="text"] { 
            flex: 1; padding: 12px; border: 1px solid #ddd; 
            border-radius: 6px; font-size: 16px;
        }
        button { 
            padding: 12px 20px; background: #007bff; color: white; 
            border: none; border-radius: 6px; cursor: pointer; font-size: 16px;
        }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .loading { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 ESPN College Football Chat</h1>
            <p>Ask questions about current college football games • Data cached for 7 minutes</p>
        </div>
        
        <div id="chat" class="chat-container"></div>
        
        <div class="input-container">
            <input type="text" id="messageInput" placeholder="Ask about college football games..." 
                   onkeypress="if(event.key==='Enter') sendMessage()">
            <button onclick="sendMessage()" id="sendBtn">Send</button>
            <button onclick="refreshData()" id="refreshBtn">Refresh Data</button>
        </div>
    </div>

    <script>
        const chatContainer = document.getElementById('chat');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const refreshBtn = document.getElementById('refreshBtn');

        function addMessage(content, isUser = false, status = '') {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
            
            if (status) {
                messageDiv.innerHTML = `<div class="status">${status}</div>${content}`;
            } else {
                messageDiv.innerHTML = content;
            }
            
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function setLoading(loading) {
            sendBtn.disabled = loading;
            refreshBtn.disabled = loading;
            sendBtn.textContent = loading ? 'Thinking...' : 'Send';
        }

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            addMessage(message, true);
            messageInput.value = '';
            setLoading(true);

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message })
                });

                const data = await response.json();
                
                if (data.success) {
                    const status = data.espn_status ? `ESPN: ${data.espn_status}` : '';
                    addMessage(data.response, false, status);
                } else {
                    addMessage(`❌ Error: ${data.error}`, false);
                }
            } catch (error) {
                addMessage(`❌ Connection error: ${error.message}`, false);
            }

            setLoading(false);
        }

        async function refreshData() {
            setLoading(true);
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'refresh' })
                });

                const data = await response.json();
                addMessage(data.response, false);
            } catch (error) {
                addMessage(`❌ Error refreshing: ${error.message}`, false);
            }
            setLoading(false);
        }

        // Initial welcome message
        addMessage("👋 Welcome! Ask me anything about current college football games. I'll use live ESPN data to help you!", false, "System ready");
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serve the chat interface"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    global chat_session
    
    if not chat_session:
        return jsonify({
            'success': False,
            'error': 'Chat session not initialized'
        })
    
    data = request.json
    message = data.get('message', '')
    
    if not message:
        return jsonify({
            'success': False,
            'error': 'No message provided'
        })
    
    response = chat_session.get_response(message)
    return jsonify(response)

@app.route('/status')
def status():
    """Get system status with smart cache details"""
    global chat_session
    
    if not chat_session:
        return jsonify({'status': 'not_initialized'})
    
    # Get smart cache status
    cache_status = smart_cache.get_cache_status()
    
    return jsonify({
        'status': 'ready',
        'smart_cache': cache_status,
        'cache_type': 'smart_cache_v2'
    })

@app.route('/cache-debug')
def cache_debug():
    """Debug endpoint to inspect smart cache"""
    cache_status = smart_cache.get_cache_status()
    
    return jsonify({
        'cache_status': cache_status,
        'all_game_ids': list(smart_cache.all_game_ids),
        'cached_game_ids': list(smart_cache.game_cache.keys()),
        'total_players_mapped': len(smart_cache.player_game_mapping)
    })

def main():
    """Main function"""
    global chat_session
    
    load_dotenv()
    
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment")
        print("   Please set your API key: export GEMINI_API_KEY=your_key_here")
        return
    
    # Initialize chat session
    chat_session = WebESPNChatSession(gemini_api_key)
    
    print("🚀 Starting ESPN College Football Web Chat Server...")
    print("   Open http://localhost:5001 in your browser")
    
    app.run(host='0.0.0.0', port=5001, debug=False)

if __name__ == "__main__":
    main()
