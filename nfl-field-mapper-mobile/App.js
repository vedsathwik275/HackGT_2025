import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import useDetectionData from './hooks/useDetectionData';
import useImageProcessor from './hooks/useImageProcessor';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ProcessingStatus from './components/ProcessingStatus';
import FieldVisualization from './components/FieldVisualization';
import ExportButton from './components/ExportButton';
import NotificationManager from './components/NotificationManager';
import PlayerInfoModal from './components/PlayerInfoModal';
import BackendConnectionStatus from './components/BackendConnectionStatus';

export default function App() {
  const detectionData = useDetectionData();
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  
  // Image processor with callback for when detections are received
  const handleDetectionsReceived = useCallback(async (detections, imgDimensions) => {
    await detectionData.processDetections(detections, imgDimensions);
  }, [detectionData]);

  const imageProcessor = useImageProcessor(handleDetectionsReceived);

  // Clear all data
  const handleClearAll = useCallback(() => {
    imageProcessor.resetImagePreview();
    detectionData.clearAll();
    setSelectedPlayerIndex(null);
  }, [imageProcessor, detectionData]);

  // Handle player marker click
  const handlePlayerClick = useCallback((index) => {
    setSelectedPlayerIndex(index);
    detectionData.highlightDetection(index);
  }, [detectionData]);

  // Close player info modal
  const closePlayerInfo = useCallback(() => {
    setSelectedPlayerIndex(null);
    detectionData.clearHighlights();
  }, [detectionData]);

  // Show welcome message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🏈 NFL Field Detection Mapper initialized');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Header />
                
        <ImageUpload
          imageProcessor={imageProcessor}
          onClearAll={handleClearAll}
          isProcessingDetection={detectionData.isProcessing}
        />
        
        <ProcessingStatus
          isProcessing={imageProcessor.isProcessing}
          message={imageProcessor.processingMessage}
        />
        
        <FieldVisualization
          detections={detectionData.detections}
          mappedData={detectionData.mappedData}
          lineOfScrimmage={detectionData.lineOfScrimmage}
          fieldDimensions={detectionData.fieldDimensions}
          highlightedIndex={detectionData.highlightedIndex}
          onMarkerClick={handlePlayerClick}
        />
        
        <ExportButton 
          onExportData={detectionData.exportMappedData}
          disabled={imageProcessor.isProcessing || detectionData.isProcessing || !detectionData.mappedData}
        />
      </ScrollView>
      
      {/* Player Info Modal */}
      <PlayerInfoModal
        visible={selectedPlayerIndex !== null}
        detection={selectedPlayerIndex !== null ? detectionData.detections[selectedPlayerIndex] : null}
        mappedPlayer={selectedPlayerIndex !== null ? detectionData.getMappedPlayerById(detectionData.detections[selectedPlayerIndex]?.detection_id) : null}
        onClose={closePlayerInfo}
      />
      
      <NotificationManager />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', // bg-gray-100 equivalent
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
});