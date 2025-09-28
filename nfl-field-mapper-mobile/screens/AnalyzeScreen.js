import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FieldVisualization from '../components/FieldVisualization';
import ProcessingStatus from '../components/ProcessingStatus';
import PlaysApiClient from '../services/PlaysApiClient';

const AnalyzeScreen = ({ 
  mappedData, 
  detections, 
  isProcessing, 
  fieldDimensions, 
  lineOfScrimmage, 
  onNavigate, 
  onSavePlay,
  capturedPhoto, // Add capturedPhoto prop
  savedPlayData, // New prop for viewing saved plays
  isViewingMode = false, // New prop to indicate if we're viewing a saved play
  coverageAnalysis,
}) => {
  const [highlightedPlayerIndex, setHighlightedPlayerIndex] = useState(null);
  const [roboflowOrientedImage, setRoboflowOrientedImage] = useState(null);
  const [playName, setPlayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [playsClient] = useState(new PlaysApiClient());
  
  // Use saved play data if in viewing mode
  const currentMappedData = savedPlayData?.mappedData || mappedData;
  const currentDetections = savedPlayData?.detections || detections;
  const currentFieldDimensions = savedPlayData?.fieldDimensions || fieldDimensions;
  const currentLineOfScrimmage = savedPlayData?.lineOfScrimmage || lineOfScrimmage;
  const currentCoverageAnalysis = savedPlayData?.coverageAnalysis || coverageAnalysis;
  
  // Set play name from saved data if viewing
  useEffect(() => {
    if (isViewingMode && savedPlayData?.playName) {
      setPlayName(savedPlayData.playName);
    }
  }, [isViewingMode, savedPlayData]);
  
  // Create the same orientation that was sent to Roboflow (only for new captures)
  useEffect(() => {
    const createRoboflowOrientedImage = async () => {
      if (!capturedPhoto || isViewingMode) return;
      
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
  }, [capturedPhoto, isViewingMode]);

  const handlePlayerClick = (index) => {
    setHighlightedPlayerIndex(index);
    console.log('Player clicked:', currentDetections[index]);
  };

  const handleSavePlay = async () => {
    if (!playName.trim()) {
      Alert.alert('Error', 'Play name is required');
      return;
    }

    if (!currentMappedData || !currentDetections) {
      console.log('No data to save');
      return;
    }

    if (isViewingMode) {
      Alert.alert('Info', 'This play is already saved');
      return;
    }

    const playData = {
      playName: playName.trim(),
      timestamp: new Date().toISOString(),
      detections: currentDetections,
      mappedData: currentMappedData,
      fieldDimensions: currentFieldDimensions,
      lineOfScrimmage: currentLineOfScrimmage,
      playerCount: currentDetections.length,
      ...(currentCoverageAnalysis && { coverageAnalysis: currentCoverageAnalysis }),
    };

    try {
      setSaving(true);
      console.log('💾 Saving play to Supabase:', playName.trim());
      
      // Generate a unique play ID
      const playId = `play_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save to Supabase
      const success = await playsClient.savePlay(playId, playData);
      
      if (success) {
        console.log('✅ Play saved successfully:', playId);
        
        // Log the data and play name to terminal
        console.log('Saving play:', playName.trim());
        console.log('Play data:', JSON.stringify(playData, null, 2));
        
        if (onSavePlay) {
          onSavePlay(playData);
        }

        Alert.alert(
          'Play Saved!',
          `Successfully saved "${playName.trim()}" with ${currentDetections.length} players detected.`,
          [
            { 
              text: 'View Saved Plays', 
              onPress: () => onNavigate('home') 
            },
            { 
              text: 'OK' 
            }
          ]
        );
      } else {
        throw new Error('Save operation returned false');
      }
    } catch (error) {
      console.error('❌ Failed to save play:', error);
      Alert.alert(
        'Save Failed',
        `Failed to save play: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const renderPlayerStats = () => {
    if (!currentDetections) return null;

    // Define position arrays for color coding
    const offensivePositions = ['QB', 'RB', 'FB', 'WR', 'TE', 'C', 'OG', 'OT'];
    const defensivePositions = ['DE', 'DT', 'NT', 'LB', 'MLB', 'OLB', 'CB', 'DB', 'S', 'FS', 'SS'];
    const specialPositions = ['K', 'P', 'LS', 'KR', 'PR'];

    // Count positions for offensive and defensive players
    const offensiveCount = {};
    const defensiveCount = {};

    currentDetections.forEach(detection => {
      if (detection.class === 'ref') return; // Skip referees
      
      if (offensivePositions.includes(detection.class)) {
        offensiveCount[detection.class] = (offensiveCount[detection.class] || 0) + 1;
      } else if (defensivePositions.includes(detection.class)) {
        defensiveCount[detection.class] = (defensiveCount[detection.class] || 0) + 1;
      }
    });

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Personnel</Text>
        <View style={styles.personnelRow}>
          {/* Offensive Personnel */}
          <View style={styles.personnelColumn}>
            {Object.entries(offensiveCount).map(([position, count]) => (
              <View key={position} style={styles.personnelItem}>
                <View style={[styles.personnelDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.personnelText}>{count} {position}</Text>
              </View>
            ))}
          </View>
          
          {/* Defensive Personnel */}
          <View style={styles.personnelColumn}>
            {Object.entries(defensiveCount).map(([position, count]) => (
              <View key={position} style={styles.personnelItem}>
                <View style={[styles.personnelDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.personnelText}>{count} {position}</Text>
              </View>
            ))}
          </View>
        </View>
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

  if (!currentMappedData || !currentDetections) {
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isViewingMode ? 'Saved Play' : 'Play Analysis'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Viewing Mode Indicator */}
        {isViewingMode && (
          <View style={styles.viewingModeIndicator}>
            <Text style={styles.viewingModeText}>📋 Viewing saved play</Text>
          </View>
        )}

        {/* Image Preview (only for new captures) */}
        {roboflowOrientedImage && !isViewingMode && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: roboflowOrientedImage.uri }} style={styles.imagePreview} />
          </View>
        )}

        {/* Coverage Call (above personnel) */}
        {currentCoverageAnalysis?.coverage_call && (
          <View style={styles.coverageContainer}>
            <Text style={styles.coverageTitle}>Coverage Call</Text>
            <Text style={styles.coverageText}>{currentCoverageAnalysis.coverage_call}</Text>
          </View>
        )}

        {/* Player Stats */}
        {renderPlayerStats()}

        {/* Field Visualization */}
        <View style={styles.fieldContainer}>
          <FieldVisualization
            detections={currentDetections}
            mappedData={currentMappedData}
            lineOfScrimmage={currentLineOfScrimmage}
            fieldDimensions={currentFieldDimensions}
            highlightedIndex={highlightedPlayerIndex}
            onMarkerClick={handlePlayerClick}
          />
        </View>

        {/* Save Play Section (only for new captures) */}
        {!isViewingMode && (
          <View style={styles.saveSection}>
            <TextInput
              style={styles.playNameInput}
              placeholder="Enter play name..."
              value={playName}
              onChangeText={setPlayName}
              editable={!saving}
            />
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                (!playName.trim() || saving) && styles.saveButtonDisabled
              ]} 
              onPress={handleSavePlay}
              disabled={!playName.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome 
                  name="save" 
                  size={24} 
                  color={!playName.trim() ? "#9ca3af" : "#fff"} 
                />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Play Info for Saved Plays */}
        {isViewingMode && savedPlayData && (
          <View style={styles.playInfoContainer}>
            <Text style={styles.playInfoTitle}>Play Information</Text>
            <Text style={styles.playInfoText}>
              Name: {savedPlayData.playName}
            </Text>
            <Text style={styles.playInfoText}>
              Saved: {new Date(savedPlayData.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.playInfoText}>
              Players: {savedPlayData.playerCount}
            </Text>
          </View>
        )}

        {/* Player Details */}
        {highlightedPlayerIndex !== null && currentDetections[highlightedPlayerIndex] && (
          <View style={styles.playerDetails}>
            <Text style={styles.playerDetailsTitle}>Selected Player</Text>
            <Text style={styles.playerDetailsText}>
              Position: {currentDetections[highlightedPlayerIndex].class}
            </Text>
            <Text style={styles.playerDetailsText}>
              Confidence: {(currentDetections[highlightedPlayerIndex].confidence * 100).toFixed(1)}%
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
    </KeyboardAvoidingView>
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
    paddingTop: 60, // Increased padding to move the header further down
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
  viewingModeIndicator: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  viewingModeText: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '500',
  },
  coverageContainer: {
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
  coverageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  coverageText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
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
  personnelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personnelColumn: {
    flex: 1,
    paddingHorizontal: 10,
  },
  personnelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personnelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  personnelText: {
    fontSize: 16,
    color: '#1f2937',
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
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  saveSection: {
    flexDirection: 'row',
    alignItems: 'center',
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
  playNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 12,
  },
  playInfoContainer: {
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
  playInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  playInfoText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
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
});

export default AnalyzeScreen; 