#!/usr/bin/env python3
"""
Simple test script for ESPN College Football LangChain Tool + Gemini integration
"""
import os
from dotenv import load_dotenv
from espn_langchain_tool import create_espn_tool

def main():
    """Simple test of the ESPN scraper + Gemini pipeline"""
    
    # Load environment variables
    load_dotenv()
    
    print("🏈 ESPN College Football Scraper + Gemini Test")
    print("=" * 50)
    
    # Create the tool
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("⚠️  No GEMINI_API_KEY found in environment")
        print("   Tool will run without AI analysis")
    
    tool = create_espn_tool(gemini_api_key=gemini_api_key)
    
    # Test 1: Basic scraping without analysis
    print("\n📊 Test 1: Basic scraping (no AI analysis)")
    print("-" * 30)
    result1 = tool._run(analyze_data=False)
    print(result1)
    
    # Test 2: Scraping with default Gemini analysis (if API key available)
    if gemini_api_key:
        print("\n🤖 Test 2: Scraping with Gemini analysis")
        print("-" * 30)
        result2 = tool._run(analyze_data=True)
        print(result2)
        
        # Test 3: Custom prompt
        print("\n🎯 Test 3: Custom analysis prompt")
        print("-" * 30)
        custom_prompt = "Focus on any upsets or close games. Keep it brief."
        result3 = tool._run(analyze_data=True, custom_prompt=custom_prompt)
        print(result3)
    else:
        print("\n⚠️  Skipping Gemini tests - no API key provided")
        print("   Set GEMINI_API_KEY environment variable to test AI features")
    
    print("\n✅ Test completed!")

if __name__ == "__main__":
    main()
