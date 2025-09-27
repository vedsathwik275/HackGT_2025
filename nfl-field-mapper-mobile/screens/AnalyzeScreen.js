import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import FieldVisualization from '../components/FieldVisualization';
import ProcessingStatus from '../components/ProcessingStatus';

const AnalyzeScreen = ({ 
  mappedData, 
  detections, 
  isProcessing, 
  fieldDimensions, 
  lineOfScrimmage, 
  onNavigate, 
  onSavePlay,
  capturedPhoto // Add capturedPhoto prop
}) => {
  const [highlightedPlayerIndex, setHighlightedPlayerIndex] = useState(null);
  const [roboflowOrientedImage, setRoboflowOrientedImage] = useState(null);
  
  // Create the same orientation that was sent to Roboflow
  useEffect(() => {
    const createRoboflowOrientedImage = async () => {
      if (!capturedPhoto) return;
      
      try {
        const isPortrait = capturedPhoto.height > capturedPhoto.width;
        console.log('🖼️ Creating Roboflow-oriented image display...');
        console.log('Original image orientation:', isPortrait ? 'Portrait' : 'Landscape');
        
        if (isPortrait) {
          console.log('🔄 Rotating display image to match Roboflow submission...');
          const rotatedImage = await ImageManipulator.manipulateAsync(
            capturedPhoto.uri,
            [{ rotate: 270 }],
            { 
              compress: 0.9, 
              format: ImageManipulator.SaveFormat.JPEG 
            }
          );
          setRoboflowOrientedImage(rotatedImage);
          console.log('✅ Display image rotated to landscape');
        } else {
          // Already landscape, use as-is
          setRoboflowOrientedImage(capturedPhoto);
          console.log('✅ Display image already landscape');
        }
      } catch (error) {
        console.error('Error creating Roboflow-oriented image:', error);
        // Fallback to original image
        setRoboflowOrientedImage(capturedPhoto);
      }
    };
    
    createRoboflowOrientedImage();
  }, [capturedPhoto]);

  const handlePlayerClick = (index) => {
    setHighlightedPlayerIndex(index);
    console.log('Player clicked:', detections[index]);
  };

  const handleSavePlay = () => {
    if (!mappedData || !detections) {
      Alert.alert('Error', 'No data to save');
      return;
    }

    const playData = {
      timestamp: new Date().toISOString(),
      detections,
      mappedData,
      fieldDimensions,
      lineOfScrimmage,
      playerCount: detections.length,
    };

    // Log the data for now (as requested)
    console.log('Saving play data:', JSON.stringify(playData, null, 2));

    console.log('playData', playData);
    
    if (onSavePlay) {
      onSavePlay(playData);
    }

    Alert.alert(
      'Play Saved!',
      `Successfully saved play with ${detections.length} players detected.`,
      [{ text: 'OK' }]
    );
  };

  const renderPlayerStats = () => {
    if (!mappedData || !detections) return null;

    const offensivePlayers = mappedData.players?.filter(p => p.team === 'offense') || [];
    const defensivePlayers = mappedData.players?.filter(p => p.team === 'defense') || [];

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Play Analysis</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{detections.length}</Text>
            <Text style={styles.statLabel}>Total Players</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{offensivePlayers.length}</Text>
            <Text style={styles.statLabel}>Offense</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{defensivePlayers.length}</Text>
            <Text style={styles.statLabel}>Defense</Text>
          </View>
        </View>
        
        {lineOfScrimmage && (
          <Text style={styles.scrimmageText}>
            Line of Scrimmage: {lineOfScrimmage.toFixed(1)} yards
          </Text>
        )}
      </View>
    );
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ProcessingStatus isProcessing={true} message="Analyzing player positions..." />
          <Text style={styles.loadingText}>
            Processing your field image and mapping player coordinates...
          </Text>
        </View>
      </View>
    );
  }

  if (!mappedData || !detections) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to analyze the image</Text>
          <Text style={styles.errorSubtext}>
            No players were detected in the captured image
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => onNavigate('camera')}
          >
            <Text style={styles.retryButtonText}>Take New Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Play Analysis</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Image Preview */}
        {roboflowOrientedImage && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.imageLabel}>Image as analyzed by AI (Roboflow orientation)</Text>
            <Image source={{ uri: roboflowOrientedImage.uri }} style={styles.imagePreview} />
          </View>
        )}

        {/* Raw Roboflow Predictions */}
        {detections && detections.length > 0 && (
          <View style={styles.rawPredictionsContainer}>
            <Text style={styles.rawPredictionsTitle}>Raw Roboflow Predictions</Text>
            <ScrollView 
              style={styles.jsonScrollView} 
              nestedScrollEnabled={true}
            >
              <Text style={styles.jsonText}>
                {JSON.stringify(detections, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}

        {/* Player Stats */}
        {renderPlayerStats()}

        {/* Field Visualization */}
        <View style={styles.fieldContainer}>
          <FieldVisualization
            detections={detections}
            mappedData={mappedData}
            lineOfScrimmage={lineOfScrimmage}
            fieldDimensions={fieldDimensions}
            highlightedIndex={highlightedPlayerIndex}
            onMarkerClick={handlePlayerClick}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSavePlay}>
          <Text style={styles.saveButtonText}>💾 Save Play</Text>
        </TouchableOpacity>

        {/* Player Details */}
        {highlightedPlayerIndex !== null && detections[highlightedPlayerIndex] && (
          <View style={styles.playerDetails}>
            <Text style={styles.playerDetailsTitle}>Selected Player</Text>
            <Text style={styles.playerDetailsText}>
              Position: {detections[highlightedPlayerIndex].class}
            </Text>
            <Text style={styles.playerDetailsText}>
              Confidence: {(detections[highlightedPlayerIndex].confidence * 100).toFixed(1)}%
            </Text>
            <TouchableOpacity 
              style={styles.clearSelectionButton}
              onPress={() => setHighlightedPlayerIndex(null)}
            >
              <Text style={styles.clearSelectionText}>Clear Selection</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for floating capture button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 20,
  },
  backButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 80, // Same width as back button for centering
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrimmageText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  fieldContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  saveButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerDetails: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  playerDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  playerDetailsText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
  },
  clearSelectionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearSelectionText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  imageLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  rawPredictionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rawPredictionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  jsonScrollView: {
    maxHeight: 200, // Limit height for scrollable JSON
  },
  jsonText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default AnalyzeScreen; 