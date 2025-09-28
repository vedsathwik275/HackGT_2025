# NFL Field Mapper Mobile

## 🆕 Streamlined Camera Workflow

The app has been completely redesigned for a simple, camera-focused user experience:

### User Flow:
1. **Home Screen**: Shows capture button and previous play history
2. **Camera Screen**: Take photo of NFL field with guided frame
3. **Photo Review**: Choose to Analyze or Retake the photo  
4. **Analysis Screen**: View player positions with field visualization and save plays

### Key Features:
- **Floating Capture Button**: Always accessible from any screen (except camera/review)
- **AI Integration**: Automatic player detection using Roboflow API
- **Backend Mapping**: Real-time coordinate mapping via backend service
- **Play Saving**: Save and log play analysis data (JSON format)
- **Clean Navigation**: Simple state-based screen navigation

### Technical Implementation:
- **Screens**: Home, Camera, PhotoReview, Analyze
- **Components**: FloatingCaptureButton, existing visualization components
- **Hooks**: useDetectionData, useImageProcessor (integrated with new workflow)
- **Camera**: Expo Camera with permissions handling

---

# 🏈 NFL Field Detection Mapper (React Native)

A React Native mobile application for detecting NFL players and referees in football images, with automatic coordinate mapping to field positions and team classification.

## ✨ Features

- **📱 Mobile-First Design**: Native mobile interface optimized for touch interactions
- **📷 Camera Integration**: Take photos directly from the app or select from gallery
- **🔍 AI-Powered Detection**: Automatically detect players and referees using computer vision
- **📍 Coordinate Mapping**: Convert pixel coordinates to accurate field positions in yards
- **⚡ Team Classification**: Automatically classify players as offense or defense
- **🏟️ Field Visualization**: Interactive SVG-based field visualization with player markers
- **📊 Advanced Analytics**: Team balance analysis, confidence scoring, and field metrics
- **📤 Data Export**: Export mapped coordinates as JSON files and share them
- **📱 Cross-Platform**: Works on iOS and Android devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- **Backend Server**: The app now requires a backend server for coordinate processing

### Backend Setup (Required)

⚠️ **Important**: The mobile app now requires the backend server to be running for coordinate mapping functionality.

1. **Start the backend server**:
   ```bash
   cd ../backend
   npm install
   npm run dev
   ```

2. **Verify backend is running**:
   - Open browser to `http://localhost:3000/health`
   - Should show: `{"status":"OK","service":"NFL Field Mapper Backend"}`

3. **Backend features**:
   - Processes coordinate mapping on server
   - Handles file exports and downloads
   - Provides real-time connection status in app

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd nfl-field-mapper-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your physical device

### Building for Production

```bash
# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android

# Build for both platforms
npx eas build --platform all
```

## 🎮 Usage

### 1. Image Upload & Detection

- **📷 Camera**: Tap "Select Image" and choose "Camera" to take a photo
- **🖼️ Gallery**: Tap "Select Image" and choose "Gallery" to select an existing image
- **🔍 AI Detection**: Tap "Detect Players" to analyze the image
- **📂 Sample Data**: Tap "Sample Data" for a quick demo
- **📄 JSON Import**: Tap "Load JSON" to load previously saved detection data

### 2. Field Visualization

- **📱 Touch Interactions**: Tap on player markers to highlight them
- **🎨 Team Colors**: 
  - 🟢 Green = Offense
  - 🔴 Red = Defense  
  - 🟡 Yellow = Referees
  - 🔵 Blue = Unclassified Players
- **📏 Line of Scrimmage**: Dashed yellow line shows the estimated line of scrimmage

### 3. Data Analysis

- **📊 Statistics Panel**: View detection counts, team balance, and field metrics
- **📋 Detection Table**: Detailed breakdown of each player with coordinates (scrollable)
- **📤 Export Data**: Share mapped coordinates as JSON for further analysis

### 4. Mobile-Specific Features

- **📱 Responsive Design**: Optimized for various screen sizes
- **🔄 Pull-to-Refresh**: Refresh data with pull gesture
- **📳 Haptic Feedback**: Touch feedback for better user experience
- **🔔 Push Notifications**: Status updates and completion alerts
- **🔌 Backend Integration**: Real-time server connection monitoring
- **☁️ Cloud Processing**: Coordinate calculations handled on backend server

## 🏗️ Architecture

### Component Structure

```
components/
├── Header.js                 # App header with title and description
├── ImageUpload.js           # Image selection with camera/gallery options
├── ProcessingStatus.js      # Loading indicators and progress
├── StatsPanel.js           # Statistics dashboard with team metrics
├── FieldVisualization.js   # Interactive SVG field with player markers
├── DetectionTable.js       # Scrollable data table with export
└── NotificationManager.js  # Toast notifications system

hooks/
├── useDetectionData.js     # State management for detections
└── useImageProcessor.js    # Image processing and API calls

services/
├── CoordinateMapperService.js      # DEPRECATED - moved to backend
└── CoordinateMapperApiClient.js    # API client for backend communication
```

### Key Technologies

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build tools
- **React Native SVG**: High-quality field visualization
- **Expo Image Picker**: Camera and gallery access
- **Expo Document Picker**: JSON file selection
- **Expo File System**: File operations and storage
- **Expo Sharing**: Cross-platform file sharing
- **Custom Hooks**: Reusable state management and logic

## 🔧 Configuration

### API Configuration

Update the API credentials in `hooks/useImageProcessor.js`:

```javascript
const API_KEY = "your-roboflow-api-key";
const API_URL = "https://serverless.roboflow.com/your-model/version";
```

### App Configuration

Customize app settings in `app.json`:

```json
{
  "expo": {
    "name": "NFL Field Mapper",
    "slug": "nfl-field-mapper-mobile",
    "version": "1.0.0"
  }
}
```

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
nfl-field-mapper-mobile/
├── components/         # React Native components
├── hooks/             # Custom hooks
├── services/          # Utility services
├── assets/            # Images and icons
├── App.js            # Main application component
├── app.json          # Expo configuration
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

### Available Scripts

- `npx expo start` - Start development server
- `npx expo start --ios` - Start with iOS simulator
- `npx expo start --android` - Start with Android emulator
- `npx expo start --web` - Start web version
- `npx eas build` - Build production app

### Adding New Features

1. **New Components**: Add to `components/`
2. **Custom Hooks**: Add to `hooks/` 
3. **Utilities**: Add to `services/`
4. **Styling**: Use StyleSheet.create() for consistent styling

## 🐛 Troubleshooting

### Common Issues

1. **API Errors**: Check your Roboflow API key and URL
2. **Build Errors**: Ensure all dependencies are installed (`npm install`)
3. **Permission Issues**: Check camera and storage permissions in device settings
4. **Detection Problems**: Check image format and network connectivity

### Debug Mode

- Use React Native Debugger or Flipper for debugging
- Check Metro bundler logs for build issues
- Use `console.log()` statements for debugging logic

## 📈 Performance

### Optimization Features

- **React.memo**: Prevents unnecessary re-renders
- **useCallback/useMemo**: Optimizes expensive calculations
- **Native Components**: Better performance than web views
- **SVG Graphics**: Scalable and performant visualizations

### Performance Tips

- Use smaller images for faster processing
- Clear data regularly to free memory
- Monitor network requests and API usage

## 🔒 Security

- API keys should be stored securely (consider using Expo SecureStore)
- Input validation on all file uploads
- Proper permission handling for camera and storage

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API level 21+ (Android 5.0+)
- **Web**: Modern browsers (development/testing)

## 📝 License

This project is part of HackGT 2025 and is available for educational and development purposes.

## 🤖 API Credits

Player detection powered by [Roboflow](https://roboflow.com/) computer vision API.

---

**Made with ⚡ React Native and 🏈 for HackGT 2025**
