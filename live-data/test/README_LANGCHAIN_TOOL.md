# ESPN College Football LangChain Tool + Gemini

A simple LangChain tool that scrapes ESPN college football data and optionally analyzes it with Google's Gemini AI.

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up Gemini API (optional):**
   - Get your API key from: https://makersuite.google.com/app/apikey
   - Set environment variable: `export GEMINI_API_KEY=your_key_here`
   - Or create a `.env` file with: `GEMINI_API_KEY=your_key_here`

3. **Run the test:**
   ```bash
   python simple_test.py
   ```

## Usage

### As a LangChain Tool

```python
from espn_langchain_tool import create_espn_tool

# Create the tool
tool = create_espn_tool(gemini_api_key="your_key_here")

# Use the tool
result = tool._run(
    analyze_data=True,
    custom_prompt="What are the biggest upsets today?"
)
print(result)
```

### Direct Usage

```python
from espn_langchain_tool import ESPNCollegeFootballTool

tool = ESPNCollegeFootballTool(gemini_api_key="your_key_here")

# Basic scraping only
result = tool._run(analyze_data=False)

# With AI analysis
result = tool._run(analyze_data=True)

# With custom prompt
result = tool._run(
    analyze_data=True, 
    custom_prompt="Focus on defensive performances"
)
```

## What it does

1. **Scrapes ESPN college football data:**
   - Current game scores and status
   - Team information and records
   - Detailed player statistics
   - Box score data

2. **Optionally analyzes with Gemini:**
   - Identifies interesting games and storylines
   - Highlights upsets and surprising scores
   - Notes standout player performances
   - Provides custom analysis based on prompts

## Files

- `espn_langchain_tool.py` - Main LangChain tool implementation
- `simple_test.py` - Test script demonstrating usage
- `col_full_test.py` - Original ESPN scraper (dependency)
- `requirements.txt` - Python dependencies

## Notes

- The tool works without a Gemini API key (scraping only)
- With API key, you get AI-powered analysis of the data
- Respects ESPN's servers with built-in delays
- Returns formatted, readable results
