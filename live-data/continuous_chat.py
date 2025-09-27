#!/usr/bin/env python3
"""
Continuous chat script with ESPN College Football data + Gemini
Maintains conversation context and caches ESPN data for 7 minutes
"""
import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai
from espn_langchain_tool import create_espn_tool

class ESPNChatSession:
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.espn_tool = create_espn_tool(gemini_api_key=gemini_api_key)
        
        # Initialize Gemini chat
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.chat = self.model.start_chat(history=[])
        
        print("🏈 ESPN College Football Chat Session Started")
        print("=" * 50)
        print("Available commands:")
        print("• Type any question about college football")
        print("• 'refresh' - Force refresh ESPN data")
        print("• 'quit' or 'exit' - End session")
        print("• Data is automatically cached for 7 minutes")
        print("=" * 50)
    
    def handle_user_input(self, user_input: str) -> str:
        """Process user input and return response"""
        user_input = user_input.strip().lower()
        
        if user_input in ['quit', 'exit', 'q']:
            return "QUIT"
        
        if user_input == 'refresh':
            # Force refresh by clearing cache
            import espn_langchain_tool
            espn_langchain_tool._cached_data = None
            espn_langchain_tool._cache_timestamp = None
            return "🔄 Cache cleared - next query will fetch fresh data"
        
        # Get raw ESPN data (not just summary)
        scraped_data = self.espn_tool._get_or_scrape_data()
        
        # Check if ESPN data retrieval failed
        if not scraped_data:
            return f"Sorry, I'm having trouble getting current ESPN data. Try typing 'refresh' to clear the cache and fetch new data."
        
        # Send full raw data to Gemini with context
        prompt = f"""
        You are a college football expert assistant. Use the following current ESPN data to answer the user's question.
        
        Current ESPN Data:
        {scraped_data}
        
        User Question: {user_input}
        
        Please provide a helpful, informative response based on the current data. You have access to detailed player statistics, game scores, and team information.
        """
        
        try:
            response = self.chat.send_message(prompt)
            return response.text
        except Exception as e:
            return f"❌ Error getting response: {str(e)}"
    
    def run(self):
        """Main chat loop"""
        while True:
            try:
                user_input = input("\n🏈 You: ").strip()
                
                if not user_input:
                    continue
                
                print("\n🤖 Thinking...")
                response = self.handle_user_input(user_input)
                
                if response == "QUIT":
                    print("\n👋 Thanks for chatting about college football!")
                    break
                
                print(f"\n🤖 Assistant: {response}")
                
            except KeyboardInterrupt:
                print("\n\n👋 Session ended by user")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")

def main():
    """Main function"""
    load_dotenv()
    
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment")
        print("   Please set your API key: export GEMINI_API_KEY=your_key_here")
        sys.exit(1)
    
    chat_session = ESPNChatSession(gemini_api_key)
    chat_session.run()

if __name__ == "__main__":
    main()
