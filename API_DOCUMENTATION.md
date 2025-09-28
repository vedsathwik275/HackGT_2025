# NFL Field Mapper API Documentation

## Overview

This document provides comprehensive API documentation for all services in the NFL Field Mapper system. The system consists of three main APIs:

1. **Backend API** (Node.js/Express) - Coordinate mapping and play storage
2. **Live Data API** (Python/Flask) - Real-time football data and AI analysis
3. **Mobile App APIs** - Client-side service integrations

## Table of Contents

- [Backend API (Coordinate Mapping)](#backend-api-coordinate-mapping)
- [Live Data API (Football Analytics)](#live-data-api-football-analytics)
- [Authentication & Security](#authentication--security)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## Backend API (Coordinate Mapping)

**Base URL**: `https://football-next-gen-backend.vercel.app`

### Health Check

#### GET /health
Get the health status of the backend service.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "NFL Field Mapper Backend"
}
```

### Coordinate Mapping Endpoints

#### POST /api/coordinates/process
Process detection data and map coordinates automatically.

**Request Body:**
```json
{
  "predictions": [
    {
      "x": 640,
      "y": 360,
      "class": "QB",
      "confidence": 0.95,
      "detection_id": "det_001",
      "width": 50,
      "height": 80
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mappedData": {
      "metadata": {
        "coordinateSystem": {
          "xAxis": "Line of scrimmage at x=0, offensive direction is positive",
          "yAxis": "Field center at y=0, sidelines at ±26.65 yards",
          "units": "yards"
        },
        "fieldDimensions": {
          "widthYards": 53.3,
          "lengthYards": 120,
          "pixelsPerYard": 12.5
        },
        "processedAt": "2024-01-15T10:30:00.000Z"
      },
      "players": [
        {
          "detectionId": "det_001",
          "position": "QB",
          "team": "offense",
          "coordinates": {
            "xYards": -5.2,
            "yYards": 0.8,
            "originalPixelX": 640,
            "originalPixelY": 360
          },
          "confidence": 0.95,
          "boundingBox": {
            "widthPixels": 50,
            "heightPixels": 80,
            "widthYards": 4.0,
            "heightYards": 6.4
          }
        }
      ],
      "referees": [],
      "teamStats": {
        "totalPlayers": 22,
        "offenseCount": 11,
        "defenseCount": 11,
        "refereeCount": 0,
        "teamBalance": "balanced"
      }
    },
    "lineOfScrimmageX": 640,
    "fieldDims": {
      "widthPixels": 665.4,
      "lengthPixels": 1200,
      "widthYards": 53.3,
      "lengthYards": 96.0,
      "pixelsPerYard": 12.5,
      "fieldCenterY": 360
    },
    "coverageAnalysis": {
      "coverage_call": "Cover 2 Zone",
      "analysis": {
        "deep_safeties": 2,
        "deep_corners": 0,
        "man_signals": 1,
        "zone_signals": 3,
        "press_corners": 0,
        "shallow_corners": 2,
        "avg_lb_depth": 4.5
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/coordinates/map
Map coordinates with custom line of scrimmage and field dimensions.

**Request Body:**
```json
{
  "detectionData": {
    "predictions": [...]
  },
  "lineOfScrimmageX": 640,
  "fieldDims": {
    "pixelsPerYard": 12.5,
    "fieldCenterY": 360
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mappedData": {...},
    "lineOfScrimmageX": 640,
    "fieldDims": {...}
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/coordinates/export
Export mapped coordinates to JSON file.

**Request Body:**
```json
{
  "mappedData": {...},
  "filename": "play_analysis_2024.json"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "filePath": "/exports/play_analysis_2024.json",
    "filename": "play_analysis_2024.json",
    "size": 15420
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET /api/coordinates/download/:filename
Download exported file.

**Parameters:**
- `filename` (string): Name of the file to download

**Response:** File download

#### POST /api/coordinates/estimate-line
Estimate line of scrimmage from player positions.

**Request Body:**
```json
{
  "players": [
    {
      "x": 640,
      "class": "QB"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lineOfScrimmageX": 642.5,
    "playerCount": 22,
    "validPlayers": 22
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/coordinates/classify-teams
Classify players into offense/defense based on line of scrimmage.

**Request Body:**
```json
{
  "players": [...],
  "lineOfScrimmageX": 640
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "offense": [...],
    "defense": [...],
    "special": [...],
    "unknown": [],
    "lineOfScrimmageX": 640,
    "totalPlayers": 22
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET /api/coordinates/positions
Get available football positions.

**Response:**
```json
{
  "success": true,
  "data": {
    "offensive": ["QB", "RB", "FB", "WR", "TE", "C", "OG", "OT"],
    "defensive": ["DE", "DT", "NT", "LB", "MLB", "OLB", "CB", "DB", "S", "FS", "SS"],
    "special": ["K", "P", "LS", "KR", "PR"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/coordinates/field-dimensions
Calculate field dimensions from detections.

**Request Body:**
```json
{
  "detections": [...],
  "lineOfScrimmageX": 640,
  "players": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "widthPixels": 665.4,
    "lengthPixels": 1200,
    "widthYards": 53.3,
    "lengthYards": 96.0,
    "pixelsPerYard": 12.5,
    "fieldCenterY": 360,
    "backfieldMeasurementUsed": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Play Storage Endpoints

#### POST /api/plays/save
Save a play to the database.

**Request Body:**
```json
{
  "play_id": "play_1642234567890_abc123def",
  "data": {
    "playName": "Red Zone Touchdown",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "detections": [...],
    "mappedData": {...},
    "fieldDimensions": {...},
    "lineOfScrimmage": 640,
    "playerCount": 22
  }
}
```

**Response:**
```json
true
```

#### GET /api/plays
Get list of all saved play IDs.

**Response:**
```json
[
  "play_1642234567890_abc123def",
  "play_1642234567891_def456ghi"
]
```

#### GET /api/plays/:play_id
Get specific play data by ID.

**Parameters:**
- `play_id` (string): Unique play identifier

**Response:**
```json
{
  "playName": "Red Zone Touchdown",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "detections": [...],
  "mappedData": {...},
  "fieldDimensions": {...},
  "lineOfScrimmage": 640,
  "playerCount": 22
}
```

---

## Live Data API (Football Analytics)

**Base URL**: `https://nextgen-live-data-api.onrender.com/api`

### Health Check

#### GET /api/health
Get the health status of the live data service.

**Response:**
```json
{
  "status": "healthy",
  "service": "NextGen Live Football Stats API (NFL + College)",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Chat and AI Analysis

#### POST /api/chat
Send a message to the AI for football analysis.

**Request Body:**
```json
{
  "message": "How did the Chiefs perform in their last game?",
  "sport": "nfl"
}
```

**Response:**
```json
{
  "success": true,
  "response": "The Kansas City Chiefs had an impressive performance in their last game against the Denver Broncos, winning 27-17. Patrick Mahomes threw for 306 yards and 2 touchdowns with a completion rate of 68.4%. The Chiefs' rushing attack was led by Isiah Pacheco who gained 89 yards on 18 carries...",
  "stats": {
    "games_tracked": 16,
    "fresh_games": 8,
    "total_players": 704,
    "total_teams": 32,
    "sports_included": ["nfl"],
    "timing": {
      "total_duration": 3.45,
      "espn_duration": 2.1,
      "openai_duration": 1.2
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/defensive-coach
Get AI-powered defensive coaching analysis with player coordinates.

**Request Body:**
```json
{
  "message": "Analyze this defensive formation and suggest improvements",
  "coordinates": {
    "players": [
      {
        "position": "CB",
        "coordinates": {
          "xYards": 8.5,
          "yYards": -15.2
        }
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on the defensive formation analysis, I can see this appears to be a Cover 2 zone coverage. The cornerback positioned at 8.5 yards deep and -15.2 yards from center suggests they're in a shallow zone coverage...",
  "stats": {
    "coordinates_processed": 11,
    "timing": {
      "total_duration": 2.8,
      "openai_duration": 2.3
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### System Statistics

#### GET /api/stats
Get current system statistics and cache status.

**Response:**
```json
{
  "service": "NextGen Live Football Stats (NFL + College)",
  "status": "active",
  "cache": {
    "college": {
      "individual_games_cached": 12,
      "fresh_games": 8,
      "total_players_tracked": 264,
      "total_teams_tracked": 24,
      "last_full_update": "2024-01-15T10:25:00.000Z"
    },
    "nfl": {
      "individual_games_cached": 16,
      "fresh_games": 10,
      "total_players_tracked": 440,
      "total_teams_tracked": 32,
      "last_full_update": "2024-01-15T10:28:00.000Z"
    },
    "combined": {
      "total_games_cached": 28,
      "fresh_games": 18,
      "total_players_tracked": 704,
      "total_teams_tracked": 56
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Cache Management

#### POST /api/cache/clear
Clear the smart cache for both sports.

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully for both NFL and College Football",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Authentication & Security

### API Keys
- **OpenAI**: Required for AI analysis features
- **Supabase**: Required for database operations
- **Roboflow**: Required for computer vision processing

### CORS Configuration
The backend API is configured to accept requests from:
- Localhost (any port)
- React Native development environments
- Expo development servers
- Production mobile app domains

### Request Headers
```http
Content-Type: application/json
Accept: application/json
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "predictions",
      "message": "predictions must be an array"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid input data |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error |
| 503  | Service Unavailable - External service down |

### Error Types

#### Validation Errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "predictions.0.x",
      "message": "x coordinate must be numeric"
    }
  ]
}
```

#### Service Errors
```json
{
  "error": "Processing failed",
  "message": "Unable to calculate field dimensions"
}
```

#### External Service Errors
```json
{
  "error": "Supabase not configured",
  "message": "Database connection unavailable"
}
```

---

## Rate Limiting

### Backend API
- No explicit rate limiting implemented
- Relies on Vercel's built-in protections

### Live Data API
- Smart caching reduces API calls
- ESPN data cached for 2-10 minutes based on game status
- OpenAI requests are throttled by usage patterns

---

## Examples

### Complete Play Analysis Workflow

1. **Capture and Process Image**
```javascript
// Mobile app captures image and sends to Roboflow
const detections = await roboflowAPI.detectPlayers(imageData);

// Send detections to backend for processing
const response = await fetch('https://football-next-gen-backend.vercel.app/api/coordinates/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ predictions: detections })
});

const result = await response.json();
```

2. **Save Play Data**
```javascript
// Save the analyzed play
const playData = {
  playName: "Goal Line Stand",
  timestamp: new Date().toISOString(),
  detections: detections,
  mappedData: result.data.mappedData,
  fieldDimensions: result.data.fieldDims,
  lineOfScrimmage: result.data.lineOfScrimmageX,
  playerCount: detections.length
};

const playId = `play_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

await fetch('https://football-next-gen-backend.vercel.app/api/plays/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ play_id: playId, data: playData })
});
```

3. **Get AI Analysis**
```javascript
// Get defensive coaching insights
const aiResponse = await fetch('https://nextgen-live-data-api.onrender.com/api/defensive-coach', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Analyze this defensive formation",
    coordinates: result.data.mappedData
  })
});

const coaching = await aiResponse.json();
```

### Live Data Query
```javascript
// Query live NFL data
const liveDataResponse = await fetch('https://nextgen-live-data-api.onrender.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What are the current NFL scores?",
    sport: "nfl"
  })
});

const liveData = await liveDataResponse.json();
```

---

## SDK and Client Libraries

### JavaScript/React Native Client
The mobile app includes pre-built API clients:
- `CoordinateMapperApiClient.js` - Backend API integration
- `LiveDataApiClient.js` - Live data API integration
- `PlaysApiClient.js` - Play storage operations

### Usage Example
```javascript
import CoordinateMapperApiClient from './services/CoordinateMapperApiClient';
import LiveDataApiClient from './services/LiveDataApiClient';

const coordinateAPI = new CoordinateMapperApiClient();
const liveDataAPI = new LiveDataApiClient();

// Process detections
const result = await coordinateAPI.processDetections(detectionData);

// Get AI insights
const insights = await liveDataAPI.sendChatMessage("Analyze this play");
```

This API documentation provides comprehensive coverage of all endpoints and functionality across the NFL Field Mapper system.
