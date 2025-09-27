# NFL Field Mapper Backend

An Express.js backend API for processing football player coordinate mapping from detection data. This backend service converts pixel coordinates from computer vision detection results into field-relative coordinates measured in yards.

## Features

- **Coordinate Mapping**: Convert pixel coordinates to field-relative coordinates in yards
- **Team Classification**: Automatically classify players into offense/defense/special teams
- **Line of Scrimmage Estimation**: Smart estimation of line of scrimmage position
- **Field Dimension Calculation**: Calculate field dimensions and scaling factors
- **Data Export**: Export processed data to JSON files with download capability
- **Position Validation**: Comprehensive football position classification
- **RESTful API**: Clean, documented API endpoints with validation

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment** (create `.env` file):
   ```bash
   PORT=3000
   NODE_ENV=development
   MAX_FILE_SIZE=50mb
   EXPORT_DIR=./exports
   ```

3. **Start the server**:
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Verify installation**:
   ```bash
   curl http://localhost:3000/health
   ```

## API Documentation

### Base URL
```
http://localhost:3000/api/coordinates
```

### Endpoints

#### 1. Process Detection Data
**POST** `/process`

Process complete detection data and return mapped coordinates.

**Request Body:**
```json
{
  "predictions": [
    {
      "x": 150.5,
      "y": 200.3,
      "width": 40,
      "height": 60,
      "class": "QB",
      "confidence": 0.95,
      "detection_id": "player_1"
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
          "pixelsPerYard": 10.5
        },
        "processedAt": "2024-01-15T10:30:00.000Z"
      },
      "players": [
        {
          "detectionId": "player_1",
          "position": "QB",
          "team": "offense",
          "coordinates": {
            "xYards": -5.5,
            "yYards": 2.3,
            "originalPixelX": 150.5,
            "originalPixelY": 200.3
          },
          "confidence": 0.95
        }
      ],
      "teamStats": {
        "totalPlayers": 22,
        "offenseCount": 11,
        "defenseCount": 11,
        "teamBalance": "balanced"
      }
    }
  }
}
```

#### 2. Map Coordinates with Custom Parameters
**POST** `/map`

Map coordinates with custom line of scrimmage and field dimensions.

**Request Body:**
```json
{
  "detectionData": {
    "predictions": [...]
  },
  "lineOfScrimmageX": 300.5,
  "fieldDims": {
    "pixelsPerYard": 12.0,
    "fieldCenterY": 250.0
  }
}
```

#### 3. Export Data
**POST** `/export`

Export mapped coordinate data to JSON file.

**Request Body:**
```json
{
  "mappedData": { ... },
  "filename": "game_1_coordinates.json"
}
```

#### 4. Download File
**GET** `/download/:filename`

Download exported JSON file.

#### 5. Estimate Line of Scrimmage
**POST** `/estimate-line`

Estimate the line of scrimmage position from player data.

**Request Body:**
```json
{
  "players": [
    {
      "x": 150,
      "y": 200,
      "class": "QB"
    }
  ]
}
```

#### 6. Classify Teams
**POST** `/classify-teams`

Classify players into offense/defense based on line of scrimmage.

#### 7. Get Available Positions
**GET** `/positions`

Get all available football positions for validation.

**Response:**
```json
{
  "success": true,
  "data": {
    "offensive": ["QB", "RB", "FB", "WR", "TE", "C", "OG", "OT"],
    "defensive": ["DE", "DT", "NT", "LB", "MLB", "OLB", "CB", "DB", "S", "FS", "SS"],
    "special": ["K", "P", "LS", "KR", "PR"]
  }
}
```

#### 8. Calculate Field Dimensions
**POST** `/field-dimensions`

Calculate field dimensions from detection data.

#### 9. Health Check
**GET** `/health`

Service health check endpoint.

## Architecture

### Project Structure
```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── .gitignore            # Git ignore rules
├── routes/
│   └── coordinate-routes.js    # API routes
├── services/
│   └── CoordinateMapperService.js    # Core mapping logic
├── middleware/
│   ├── errorHandler.js    # Error handling
│   └── requestLogger.js   # Request logging
└── exports/              # Exported files directory
    └── .gitkeep
```

### Key Components

#### CoordinateMapperService
The core service that handles:
- Player position classification
- Team assignment (offense/defense)
- Line of scrimmage estimation
- Coordinate transformation
- Field dimension calculations

#### API Routes
RESTful endpoints with:
- Input validation using express-validator
- Comprehensive error handling
- Detailed response formatting
- File upload/download capabilities

#### Middleware
- **Error Handler**: Centralized error processing
- **Request Logger**: Detailed request/response logging
- **CORS**: Cross-origin resource sharing for React Native
- **Security**: Helmet.js security headers

## Data Format

### Input Detection Format
```json
{
  "predictions": [
    {
      "x": 150.5,           // Pixel x-coordinate
      "y": 200.3,           // Pixel y-coordinate
      "width": 40,          // Bounding box width
      "height": 60,         // Bounding box height
      "class": "QB",        // Football position
      "confidence": 0.95,   // Detection confidence
      "detection_id": "1"   // Unique identifier
    }
  ]
}
```

### Output Coordinate Format
```json
{
  "players": [
    {
      "detectionId": "1",
      "position": "QB",
      "team": "offense",
      "coordinates": {
        "xYards": -5.5,     // Yards from line of scrimmage
        "yYards": 2.3,      // Yards from field center
        "originalPixelX": 150.5,
        "originalPixelY": 200.3
      },
      "confidence": 0.95,
      "boundingBox": {
        "widthYards": 3.8,
        "heightYards": 5.7
      }
    }
  ]
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "msg": "x coordinate must be numeric",
      "param": "predictions.0.x",
      "location": "body"
    }
  ]
}
```

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (when implemented)

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MAX_FILE_SIZE` - Maximum upload size
- `EXPORT_DIR` - Directory for exported files

### CORS Configuration
Configured to allow requests from:
- `http://localhost:3000` (React apps)
- `exp://localhost:19000` (Expo development)
- `http://localhost:19006` (Expo web)

## Integration with Mobile App

The mobile app can now make API calls instead of processing data locally:

```javascript
// Replace local processing with API call
const response = await fetch('http://localhost:3000/api/coordinates/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ predictions: detectionData })
});

const result = await response.json();
```

## Future Enhancements

- [ ] Database integration for storing processed data
- [ ] Authentication and authorization
- [ ] Real-time processing with WebSockets
- [ ] Batch processing endpoints
- [ ] Performance metrics and monitoring
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] API rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License