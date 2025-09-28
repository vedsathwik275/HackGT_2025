# 🏈 NextGen Live Football Stats API Documentation

**Base URL**: `https://nextgen-live-data-api.onrender.com`

A modern REST API providing real-time NFL and College Football statistics with AI-powered insights using Google Gemini AI and ESPN data scraping.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Base Information](#base-information)
- [Endpoints](#endpoints)
  - [GET /](#get-)
  - [GET /api/health](#get-apihealth)
  - [POST /api/chat](#post-apichat)
  - [GET /api/stats](#get-apistats)
  - [POST /api/cache/clear](#post-apicacheclear)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## 🔐 Authentication

This API does not require authentication for public endpoints. The Gemini AI integration is handled server-side with API keys.

## ℹ️ Base Information

### GET /

Returns basic API information and available endpoints.

**Response:**
```json
{
  "service": "NextGen Live Football Stats API",
  "version": "1.0.0",
  "description": "Real-time NFL and College Football statistics with AI-powered insights",
  "endpoints": {
    "health": "/api/health",
    "chat": "/api/chat (POST)",
    "stats": "/api/stats",
    "cache_clear": "/api/cache/clear (POST)"
  },
  "documentation": "https://github.com/your-repo/live-data",
  "status": "running"
}
```

## 📡 Endpoints

### GET /api/health

Health check endpoint that returns service status and system information.

**Response:**
```json
{
  "status": "healthy",
  "service": "NextGen Live Football Stats API",
  "timestamp": "2025-09-27T10:30:00.000Z",
  "uptime": "2 hours, 15 minutes",
  "cache_status": {
    "college": {
      "games_cached": 25,
      "last_update": "2025-09-27T10:28:00.000Z"
    },
    "nfl": {
      "games_cached": 16,
      "last_update": "2025-09-27T10:27:00.000Z"
    }
  },
  "ai_status": "connected"
}
```

**Status Codes:**
- `200 OK` - Service is healthy
- `500 Internal Server Error` - Service issues

---

### POST /api/chat

Chat with AI assistant about football statistics. Supports both NFL and College Football queries.

**Request Body:**
```json
{
  "message": "string (required)",
  "sport": "string (optional: 'nfl', 'college', or null for both)"
}
```

**Parameters:**
- `message` (string, required): Your question or query about football stats
- `sport` (string, optional): Specify sport context
  - `"nfl"` - Focus on NFL data
  - `"college"` - Focus on College Football data
  - `null` or omitted - Search both sports

**Example Request:**
```json
{
  "message": "What's the Auburn score?",
  "sport": "college"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Auburn is currently leading 21-14 against Georgia in the 3rd quarter. Auburn's offense has been strong with 312 total yards, while their defense has forced 2 turnovers.",
  "timestamp": "2025-09-27T10:30:00.000Z",
  "sport_context": "college",
  "data_freshness": "Updated 2 minutes ago"
}
```

**Special Commands:**
- `"refresh"` - Clears cache and fetches fresh data

**Status Codes:**
- `200 OK` - Successful response
- `400 Bad Request` - Missing or invalid message
- `500 Internal Server Error` - AI or data processing error

---

### GET /api/stats

Returns system statistics including cache status, data freshness, and performance metrics.

**Response:**
```json
{
  "cache_stats": {
    "college": {
      "total_games": 25,
      "active_games": 8,
      "last_full_update": "2025-09-27T10:20:00.000Z",
      "last_targeted_update": "2025-09-27T10:28:00.000Z",
      "cache_hits": 156,
      "cache_misses": 12
    },
    "nfl": {
      "total_games": 16,
      "active_games": 4,
      "last_full_update": "2025-09-27T10:18:00.000Z",
      "last_targeted_update": "2025-09-27T10:27:00.000Z",
      "cache_hits": 89,
      "cache_misses": 7
    }
  },
  "system_stats": {
    "uptime": "2 hours, 15 minutes",
    "total_requests": 1247,
    "ai_requests": 89,
    "avg_response_time": "1.2s"
  },
  "data_sources": {
    "espn_status": "connected",
    "gemini_ai_status": "connected"
  },
  "timestamp": "2025-09-27T10:30:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Statistics retrieved successfully
- `500 Internal Server Error` - Error retrieving statistics

---

### POST /api/cache/clear

Clears all cached data for both NFL and College Football. Forces fresh data fetch on next request.

**Request Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully for both NFL and College Football",
  "timestamp": "2025-09-27T10:30:00.000Z",
  "cleared": {
    "college_games": 25,
    "nfl_games": 16,
    "metadata": true
  }
}
```

**Status Codes:**
- `200 OK` - Cache cleared successfully
- `500 Internal Server Error` - Error clearing cache

## ⚠️ Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2025-09-27T10:30:00.000Z",
  "endpoint": "/api/endpoint"
}
```

**Common Error Codes:**
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server or external service error

**404 Response:**
```json
{
  "error": "Endpoint not found",
  "available_endpoints": [
    "/",
    "/api/health",
    "/api/chat",
    "/api/stats",
    "/api/cache/clear"
  ]
}
```

## 🚦 Rate Limiting

Currently no rate limiting is implemented, but consider implementing it for production use to prevent abuse.

## 📝 Examples

### Example 1: Check API Health
```bash
curl -X GET https://nextgen-live-data-api.onrender.com/api/health
```

### Example 2: Ask About College Football
```bash
curl -X POST https://nextgen-live-data-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the most exciting college football games right now?",
    "sport": "college"
  }'
```

### Example 3: Ask About NFL
```bash
curl -X POST https://nextgen-live-data-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me the Kansas City Chiefs score",
    "sport": "nfl"
  }'
```

### Example 4: General Sports Query
```bash
curl -X POST https://nextgen-live-data-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Which quarterbacks are having the best games today?"
  }'
```

### Example 5: Get System Statistics
```bash
curl -X GET https://nextgen-live-data-api.onrender.com/api/stats
```

### Example 6: Clear Cache
```bash
curl -X POST https://nextgen-live-data-api.onrender.com/api/cache/clear
```

## 🔧 JavaScript/Frontend Integration

### Using Fetch API
```javascript
// Health check
const healthCheck = async () => {
  const response = await fetch('https://nextgen-live-data-api.onrender.com/api/health');
  const data = await response.json();
  console.log(data);
};

// Chat with AI
const chatWithAI = async (message, sport = null) => {
  const response = await fetch('https://nextgen-live-data-api.onrender.com/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      sport: sport
    })
  });
  const data = await response.json();
  return data;
};

// Example usage
chatWithAI("What's the Auburn score?", "college")
  .then(response => console.log(response.response));
```

### Using Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://nextgen-live-data-api.onrender.com/api'
});

// Chat example
const response = await api.post('/chat', {
  message: "Top performing quarterbacks today",
  sport: "nfl"
});

console.log(response.data.response);
```

## 🏗️ Data Sources

- **ESPN API**: Real-time game data, scores, and statistics
- **Google Gemini AI**: Natural language processing and intelligent responses
- **Smart Caching**: 2-minute individual game updates, 10-minute full refreshes

## 🔄 Data Freshness

- **Individual Games**: Updated every 2 minutes during active games
- **Full Dataset**: Refreshed every 10 minutes
- **Targeted Updates**: Specific games updated based on user queries
- **Cache Status**: Available in `/api/health` and `/api/stats` endpoints

## 🎯 Use Cases

1. **Sports Apps**: Integrate live scores and AI insights
2. **Chatbots**: Add football knowledge to conversational AI
3. **Analytics Dashboards**: Real-time sports data visualization
4. **Fantasy Sports**: Player performance and game analysis
5. **News Applications**: Automated sports reporting and updates

---

**API Version**: 1.0.0  
**Last Updated**: September 27, 2025  
**Support**: [GitHub Issues](https://github.com/your-repo/live-data/issues)

🏈 **NextGen Live Football Stats API** - Bringing the future of sports data to your applications!
