import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PhotoReviewScreen = ({ capturedPhoto, onNavigate, onAnalyze, onRetake }) => {
  const handleAnalyze = () => {
    if (onAnalyze && capturedPhoto) {
      console.log('capturedPhoto', capturedPhoto);
      onAnalyze(capturedPhoto);
    }
    onNavigate('analyze');
  };

  const handleRetake = () => {
    if (onRetake) {
      onRetake();
    }
    onNavigate('camera');
  };

  if (!capturedPhoto) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No photo captured</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => onNavigate('camera')}
        >
          <Text style={styles.buttonText}>Go Back to Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Photo Preview */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: capturedPhoto.uri }} style={styles.image} />
        
        {/* Image overlay with preview info */}
        <View style={styles.imageOverlay}>
          <Text style={styles.previewText}>Photo Preview</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.backHomeButton]}
            onPress={() => onNavigate('home')}
          >
            <Entypo name="home" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.retakeButton]}
            onPress={handleRetake}
          >
            <FontAwesome5 name="redo" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.analyzeButton]}
            onPress={handleAnalyze}
          >
            <Ionicons name="analytics" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 40,
  },
  imageContainer: {
    flex: 2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  previewText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: '5%', // Move the buttons 10% higher
    left: 0,
    right: 0,
    backgroundColor: 'transparent', // Ensure no background color
    paddingTop: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#3b82f6', // Default button color
  },
  retakeButton: {
    backgroundColor: '#dc2626',
  },
  analyzeButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backHomeButton: {
    backgroundColor: '#6b7280',
  },
  backHomeText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PhotoReviewScreen; 