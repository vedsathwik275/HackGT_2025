# Backend Migration Notes

## Overview
This document outlines the migration from local coordinate processing to backend API integration for the NFL Field Mapper mobile app.

## Changes Made

### 1. New Backend Integration
- **Created**: `services/CoordinateMapperApiClient.js` - API client for backend communication
- **Replaced**: Local `CoordinateMapperService` usage with HTTP API calls
- **Added**: Backend connection status monitoring

### 2. Updated Components

#### `hooks/useDetectionData.js`
- **Before**: Used local `CoordinateMapperService` synchronously
- **After**: Uses `CoordinateMapperApiClient` with async/await patterns
- **Changes**:
  - `processDetections()` now makes HTTP requests to `/api/coordinates/process`
  - `exportMappedData()` now calls `/api/coordinates/export` endpoint
  - Added better error handling with user-friendly messages
  - Added success notifications for processed coordinates

#### `components/ExportButton.js`
- **Before**: Synchronous export handling
- **After**: Async export with loading states
- **Changes**:
  - Added loading indicator (`⏳ Exporting...`)
  - Better error/success feedback with file details
  - Proper async/await handling

#### `App.js`
- **Added**: `BackendConnectionStatus` component to monitor server connectivity
- **Shows**: Real-time backend connection status with setup instructions

#### `components/BackendConnectionStatus.js` (New)
- **Purpose**: Monitor backend server connectivity
- **Features**:
  - Real-time connection status indicator
  - Manual refresh capability
  - Setup instructions when backend is offline
  - Visual status indicators (green/red)

### 3. API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/coordinates/process` | POST | Main coordinate processing |
| `/api/coordinates/export` | POST | Export data to JSON file |
| `/api/coordinates/health` | GET | Backend health check |
| `/api/coordinates/download/:filename` | GET | Download exported files |

### 4. Error Handling Improvements

#### Before:
```javascript
try {
  coordinateMapper.processDetections(data);
} catch (error) {
  showNotification(error.message, 'error');
}
```

#### After:
```javascript
try {
  await apiClient.processDetections(data);
  showNotification('✅ Coordinates processed successfully!', 'success');
} catch (error) {
  let errorMessage = 'Error processing detections';
  if (error.message.includes('Unable to connect')) {
    errorMessage = '🔌 Backend server offline. Please start the server.';
  } else if (error.message.includes('Network request failed')) {
    errorMessage = '📡 Network error. Check your connection.';
  }
  showNotification(errorMessage, 'error');
}
```

### 5. Deprecated Files

#### `services/CoordinateMapperService.js`
- **Status**: DEPRECATED - kept for reference only
- **Replacement**: Backend service + `CoordinateMapperApiClient.js`
- **Note**: Contains deprecation warning in header

## Setup Requirements

### Backend Server
The mobile app now requires the backend server to be running:

```bash
cd backend
npm install
npm run dev
```

The server should start on `http://localhost:3000`

### Environment Configuration
The API client defaults to `http://localhost:3000` but can be configured:

```javascript
const apiClient = new CoordinateMapperApiClient('http://your-backend-url');
```

## Benefits of Migration

### Performance
- ✅ Offloaded heavy coordinate calculations to dedicated backend
- ✅ Reduced mobile app bundle size
- ✅ Better resource utilization on mobile devices

### Scalability
- ✅ Centralized coordinate mapping logic
- ✅ Easier to maintain and update algorithms
- ✅ Multiple mobile clients can use same backend

### Features
- ✅ File export handled on backend with download capability
- ✅ Better error handling and user feedback
- ✅ Connection status monitoring
- ✅ Detailed API responses with metadata

### Maintainability
- ✅ Single source of truth for coordinate mapping logic
- ✅ Easier testing of backend services
- ✅ Clear separation of concerns

## Rollback Plan

If needed, the app can be rolled back by:
1. Reverting `hooks/useDetectionData.js` to use local service
2. Removing `BackendConnectionStatus` component from `App.js`
3. Reverting `ExportButton.js` to synchronous operations
4. Re-enabling `services/CoordinateMapperService.js`

## Next Steps

### Immediate
- [ ] Test backend integration thoroughly
- [ ] Verify all coordinate mapping functions work correctly
- [ ] Test error scenarios (backend offline, network issues)

### Future Improvements
- [ ] Add authentication to backend APIs
- [ ] Implement caching for better performance
- [ ] Add batch processing capabilities
- [ ] Consider WebSocket for real-time updates
- [ ] Add API versioning support

## Testing Checklist

- [ ] Backend server starts successfully
- [ ] Connection status shows green when backend is running
- [ ] Connection status shows red when backend is stopped
- [ ] Image upload and detection processing works
- [ ] Coordinate mapping produces correct results
- [ ] Export functionality creates files on backend
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] App gracefully handles network failures

## Migration Date
**Completed**: $(date)

## Contact
For questions about this migration, please refer to the backend documentation or API documentation. 