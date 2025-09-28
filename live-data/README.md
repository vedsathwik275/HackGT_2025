# NextGen Live Football Stats

🏈 **Real-time college football statistics with AI-powered insights**

A modern, separated architecture application providing live college football data with intelligent caching and AI analysis.

## 🏗️ Architecture

### Backend API (`api_server.py`)
- **Flask REST API** serving football data
- **Smart caching system** with 2-minute individual game updates
- **Gemini AI integration** for intelligent responses
- **CORS enabled** for frontend communication

### Frontend Web App (`frontend/`)
- **Modern HTML5/CSS3/JavaScript** application
- **TailwindCSS** for responsive, beautiful UI
- **Real-time communication** with backend API
- **Progressive Web App** capabilities

## 🚀 Quick Start

### 1. Set up environment
```bash
# Set your Gemini API key
export GEMINI_API_KEY=your_gemini_api_key_here

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Start the backend API
```bash
python api_server.py
```
API will be available at: `http://localhost:5001`

### 3. Serve the frontend
```bash
# Option 1: Simple Python server
cd frontend
python -m http.server 3000

# Option 2: Any web server (nginx, Apache, etc.)
# Just serve the frontend/ directory
```
Web app will be available at: `http://localhost:3000`

## 📡 API Endpoints

- `GET /api/health` - Health check
- `POST /api/chat` - Chat with AI assistant
- `GET /api/stats` - System statistics  
- `POST /api/cache/clear` - Clear data cache

## 🎯 Features

### Smart Caching
- **Individual game updates** every 2 minutes
- **Full dataset refresh** every 10 minutes
- **Query-based targeting** (updates specific games for player/team queries)

### AI Assistant
- **Natural language queries** about any team, player, or game
- **Real-time analysis** of current games
- **Contextual responses** based on live data

### Modern UI
- **Responsive design** works on all devices
- **Real-time stats** display
- **Smooth animations** and transitions
- **Dark theme** optimized for extended use

## 🔧 Development

### File Structure
```
live-data/
├── api_server.py              # Flask API backend
├── smart_cache_manager.py     # Intelligent caching system
├── col_full_test.py          # ESPN scraper
├── requirements.txt          # Python dependencies
└── frontend/                 # Web application
    ├── index.html           # Main HTML file
    ├── assets/
    │   ├── css/
    │   │   └── styles.css   # Custom styles
    │   └── js/
    │       └── app.js       # Frontend application
    └── test/                # Development & test files
```

### Key Technologies
- **Backend**: Flask, Python 3.12+, Gemini AI
- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Data**: ESPN scraping, Smart caching
- **Styling**: TailwindCSS, Custom CSS animations

## 🎮 Usage Examples

Ask the AI assistant:
- *"What's the Auburn score?"*
- *"Haynes King passing stats"*
- *"Top performing quarterbacks today"*
- *"Which games are closest right now?"*
- *"Show me all touchdown passes this quarter"*

## 📊 Smart Cache System

The application uses an intelligent caching system:

1. **Full Refresh** (10 min): Gets all current games
2. **Targeted Updates** (2 min): Updates specific games based on queries
3. **Metadata Extraction**: Tracks all players and teams for smart matching

## 🛠️ Configuration

### Environment Variables
- `GEMINI_API_KEY` - Required for AI functionality
- `FLASK_PORT` - API server port (default: 5001)
- `FRONTEND_PORT` - Web server port (default: 3000)

### Cache Settings
- Individual game cache: 2 minutes
- Full dataset cache: 10 minutes
- Configurable in `smart_cache_manager.py`

## 📱 Progressive Web App

The frontend includes PWA capabilities:
- **Offline support** (coming soon)
- **Install prompt** for mobile devices
- **Responsive design** for all screen sizes

---

**NextGen Live Football Stats** - Bringing the future of sports data to your fingertips! 🚀
