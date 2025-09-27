# 🏈 NFL Field Detection Mapper (React)

A modern React application for detecting NFL players and referees in football images, with automatic coordinate mapping to field positions and team classification.

## ✨ Features

- **🔍 AI-Powered Detection**: Automatically detect players and referees using computer vision
- **📍 Coordinate Mapping**: Convert pixel coordinates to accurate field positions in yards
- **⚡ Team Classification**: Automatically classify players as offense or defense
- **🏟️ Field Visualization**: Interactive SVG-based field visualization with player markers
- **📊 Advanced Analytics**: Team balance analysis, confidence scoring, and field metrics
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **⌨️ Keyboard Shortcuts**: Quick actions for power users
- **📤 Data Export**: Export mapped coordinates as JSON files

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd test_refactor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## 🎮 Usage

### 1. Image Upload & Detection

- **Upload Image**: Click "Upload Football Image" to select a photo
- **AI Detection**: Click "🔍 Detect Players" to analyze the image
- **Sample Data**: Click "📂 Load Sample Data" for a quick demo
- **JSON Import**: Click "📄 Load JSON File" to load previously saved detection data

### 2. Field Visualization

- **Interactive Markers**: Click on player markers to highlight them
- **Team Colors**: 
  - 🟢 Green = Offense
  - 🔴 Red = Defense  
  - 🟡 Yellow = Referees
  - 🔵 Blue = Unclassified Players
- **Line of Scrimmage**: Dashed yellow line shows the estimated line of scrimmage

### 3. Data Analysis

- **Statistics Panel**: View detection counts, team balance, and field metrics
- **Detection Table**: Detailed breakdown of each player with coordinates
- **Export Data**: Download mapped coordinates as JSON for further analysis

### 4. Keyboard Shortcuts

- `Ctrl/Cmd + D`: Detect players in uploaded image
- `Ctrl/Cmd + S`: Load sample data
- `Ctrl/Cmd + C`: Clear all data
- `Escape`: Clear highlights

## 🏗️ Architecture

### Component Structure

```
src/
├── components/           # React components
│   ├── Header.js        # Application header
│   ├── ImageUpload.js   # Image upload and controls
│   ├── ProcessingStatus.js # Loading indicators
│   ├── StatsPanel.js    # Statistics dashboard
│   ├── FieldVisualization.js # Interactive field display
│   ├── DetectionTable.js # Data table with export
│   └── NotificationManager.js # Toast notifications
├── hooks/               # Custom React hooks
│   ├── useDetectionData.js # State management for detections
│   └── useImageProcessor.js # Image processing logic
├── services/            # Utility services
│   └── CoordinateMapperService.js # Coordinate mapping logic
├── App.js              # Main application component
├── index.js            # React entry point
└── index.css           # Styles with Tailwind CSS
```

### Key Technologies

- **React 18**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Custom Hooks**: Reusable state management and logic
- **SVG Graphics**: High-quality field visualization
- **Roboflow API**: AI-powered object detection

## 🔧 Configuration

### API Configuration

Update the API credentials in `src/hooks/useImageProcessor.js`:

```javascript
const API_KEY = "your-roboflow-api-key";
const API_URL = "https://serverless.roboflow.com/your-model/version";
```

### Styling Customization

The app uses Tailwind CSS. Customize colors and styling in:

- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - Custom CSS classes

## 📊 Data Format

### Input Detection Format

```json
{
  "predictions": [
    {
      "x": 756.5,
      "y": 550,
      "width": 61,
      "height": 100,
      "confidence": 0.92,
      "class": "player",
      "class_id": 0,
      "detection_id": "unique-id"
    }
  ]
}
```

### Output Coordinate Format

```json
{
  "metadata": {
    "coordinateSystem": {
      "xAxis": "Line of scrimmage at x=0, offensive direction is positive",
      "yAxis": "Field center at y=0, sidelines at ±26.65 yards",
      "units": "yards"
    },
    "fieldDimensions": {
      "widthYards": 53.3,
      "lengthYards": 45.2,
      "pixelsPerYard": 15.8
    }
  },
  "players": [
    {
      "detectionId": "unique-id",
      "team": "offense",
      "coordinates": {
        "xYards": -2.5,
        "yYards": 5.1
      },
      "confidence": 0.92
    }
  ],
  "teamStats": {
    "totalPlayers": 10,
    "offenseCount": 5,
    "defenseCount": 5,
    "teamBalance": "balanced"
  }
}
```

## 🤝 Development

### Project Structure

```
test_refactor/
├── public/              # Public assets
│   └── index.html      # HTML template
├── src/                # Source code
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── services/       # Utility services
│   └── styles/         # CSS files
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind configuration
└── README.md          # This file
```

### Available Scripts

- `npm start` - Start development server
- `npm build` - Create production build  
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (⚠️ irreversible)

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **Custom Hooks**: Add to `src/hooks/` 
3. **Utilities**: Add to `src/services/`
4. **Styling**: Use Tailwind classes or add to `src/index.css`

## 🐛 Troubleshooting

### Common Issues

1. **API Errors**: Check your Roboflow API key and URL
2. **Build Errors**: Ensure all dependencies are installed (`npm install`)
3. **Styling Issues**: Verify Tailwind CSS is properly configured
4. **Detection Problems**: Check image format and network connectivity

### Debug Mode

Open browser Developer Tools (F12) to see:
- Console logs for debugging information
- Network requests to the detection API
- Component state and props

## 📈 Performance

### Optimization Features

- **React.memo**: Prevents unnecessary re-renders
- **useCallback/useMemo**: Optimizes expensive calculations
- **Lazy Loading**: Components loaded on demand
- **SVG Graphics**: Scalable and performant visualizations

### Performance Tips

- Use smaller images for faster processing
- Clear data regularly to free memory
- Monitor network requests in DevTools

## 🔒 Security

- API keys should be stored in environment variables for production
- Input validation on all file uploads
- CORS configuration for API requests

## 📝 License

This project is part of HackGT 2025 and is available for educational and development purposes.

## 🤖 API Credits

Player detection powered by [Roboflow](https://roboflow.com/) computer vision API.

---

**Made with ⚡ React and 🏈 for HackGT 2025** 