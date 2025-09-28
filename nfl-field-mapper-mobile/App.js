import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import useDetectionData from './hooks/useDetectionData';
import useImageProcessor from './hooks/useImageProcessor';
import NotificationManager from './components/NotificationManager';
import FloatingCaptureButton from './components/FloatingCaptureButton';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screen imports
import { HomeScreen, CameraScreen, PhotoReviewScreen, AnalyzeScreen, ChatScreen } from './screens';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [navigationParams, setNavigationParams] = useState(null); // Store navigation parameters
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [savedPlayData, setSavedPlayData] = useState(null); // For viewing saved plays
  
  const detectionData = useDetectionData();
  
  // Image processor with callback for when detections are received
  const handleDetectionsReceived = useCallback(async (detections, imgDimensions) => {
    await detectionData.processDetections(detections, imgDimensions);
  }, [detectionData]);

  const imageProcessor = useImageProcessor(handleDetectionsReceived);

  // Navigation handler
  const handleNavigate = useCallback((screen, params = null) => {
    setCurrentScreen(screen);
    setNavigationParams(params);
    
    // Clear saved play data when navigating away from analyze screen
    if (screen !== 'analyze') {
      setSavedPlayData(null);
    }
  }, []);

  // Handle viewing a saved play
  const handleViewSavedPlay = useCallback((playData) => {
    console.log('📋 Viewing saved play:', playData.playName);
    setSavedPlayData(playData);
    setCurrentScreen('analyze');
  }, []);

  // Handle photo capture from camera
  const handlePhotoTaken = useCallback((photo) => {
    setCapturedPhoto(photo);
    console.log('Photo captured:', photo.uri);
  }, []);

  // Handle analyze process
  const handleAnalyze = useCallback(async (photo) => {
    try {
      console.log('Starting analysis process...');
      
      // Convert photo to the format expected by imageProcessor
      const fileObject = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
      };
      
      // Process the image directly without relying on state
      imageProcessor.handleImageUpload(fileObject); // Still set state for consistency
      await imageProcessor.detectPlayersInImage(fileObject); // Pass image directly
      
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }, [imageProcessor]);

  // Handle retake
  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    // Clear any previous detection data
    detectionData.clearAll();
  }, [detectionData]);

  // Handle save play
  const handleSavePlay = useCallback((playData) => {
    console.log('Play saved:', playData);
    // Here you can implement actual save logic later
    // For now, just logging as requested
  }, []);

  // Handle floating capture button press
  const handleFloatingCapture = useCallback(() => {
    handleNavigate('camera');
  }, [handleNavigate]);

  // Determine which screen to show
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen 
            onNavigate={handleNavigate} 
            onViewSavedPlay={handleViewSavedPlay}
          />
        );
      
      case 'camera':
        return (
          <CameraScreen 
            onNavigate={handleNavigate} 
            onPhotoTaken={handlePhotoTaken}
          />
        );
      
      case 'photoReview':
        return (
          <PhotoReviewScreen 
            capturedPhoto={capturedPhoto}
            onNavigate={handleNavigate}
            onAnalyze={handleAnalyze}
            onRetake={handleRetake}
          />
        );
      
      case 'analyze':
        const isViewingMode = savedPlayData !== null;
        return (
          <AnalyzeScreen 
            mappedData={isViewingMode ? null : detectionData.mappedData}
            detections={isViewingMode ? null : detectionData.detections}
            isProcessing={isViewingMode ? false : (detectionData.isProcessing || imageProcessor.isProcessing)}
            fieldDimensions={isViewingMode ? null : detectionData.fieldDimensions}
            lineOfScrimmage={isViewingMode ? null : detectionData.lineOfScrimmage}
            onNavigate={handleNavigate}
            onSavePlay={handleSavePlay}
            capturedPhoto={isViewingMode ? null : capturedPhoto}
            savedPlayData={savedPlayData}
            isViewingMode={isViewingMode}
          />
        );
      
      case 'chat':
        return (
          <ChatScreen 
            route={{ params: navigationParams }}
            onNavigate={handleNavigate}
          />
        );
      
      default:
        return (
          <HomeScreen 
            onNavigate={handleNavigate} 
            onViewSavedPlay={handleViewSavedPlay}
          />
        );
    }
  };

  // Determine if floating capture button should show
  const shouldShowFloatingButton = currentScreen !== 'camera' && currentScreen !== 'photoReview' && currentScreen !== 'chat';

  // Show welcome message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🏈 NFL Field Detection Mapper initialized with streamlined workflow');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Current Screen */}
      {renderCurrentScreen()}
      
      {/* Floating Capture Button */}
      <FloatingCaptureButton 
        onPress={handleFloatingCapture}
        show={shouldShowFloatingButton}
      />
      
      {/* Notification Manager */}
      <NotificationManager />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
});