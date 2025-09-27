import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import useDetectionData from './hooks/useDetectionData';
import useImageProcessor from './hooks/useImageProcessor';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ProcessingStatus from './components/ProcessingStatus';
import StatsPanel from './components/StatsPanel';
import FieldVisualization from './components/FieldVisualization';
import DetectionTable from './components/DetectionTable';
import NotificationManager from './components/NotificationManager';

export default function App() {
  const detectionData = useDetectionData();
  
  // Image processor with callback for when detections are received
  const handleDetectionsReceived = useCallback(async (detections, imgDimensions) => {
    await detectionData.processDetections(detections, imgDimensions);
  }, [detectionData]);

  const imageProcessor = useImageProcessor(handleDetectionsReceived);

  // Clear all data
  const handleClearAll = useCallback(() => {
    imageProcessor.resetImagePreview();
    detectionData.clearAll();
  }, [imageProcessor, detectionData]);

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
        
        <StatsPanel
          statistics={detectionData.statistics}
          fieldDimensions={detectionData.fieldDimensions}
          lineOfScrimmage={detectionData.lineOfScrimmage}
        />
        
        <FieldVisualization
          detections={detectionData.detections}
          mappedData={detectionData.mappedData}
          lineOfScrimmage={detectionData.lineOfScrimmage}
          fieldDimensions={detectionData.fieldDimensions}
          highlightedIndex={detectionData.highlightedIndex}
          onMarkerClick={detectionData.highlightDetection}
        />
        
        <DetectionTable
          detections={detectionData.detections}
          mappedData={detectionData.mappedData}
          highlightedIndex={detectionData.highlightedIndex}
          onRowClick={detectionData.highlightDetection}
          onExportData={detectionData.exportMappedData}
        />
      </ScrollView>
      
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