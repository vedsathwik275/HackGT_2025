import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';

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
        <Text style={styles.instructionText}>
          Review your captured field image. Ready to analyze the players?
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.retakeButton]} 
            onPress={handleRetake}
          >
            <Text style={styles.buttonText}>📷 Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.analyzeButton]} 
            onPress={handleAnalyze}
          >
            <Text style={styles.buttonText}>🔍 Analyze</Text>
          </TouchableOpacity>
        </View>

        {/* Back to home option */}
        <TouchableOpacity 
          style={styles.backHomeButton} 
          onPress={() => onNavigate('home')}
        >
          <Text style={styles.backHomeText}>← Back to Home</Text>
        </TouchableOpacity>
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
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    alignItems: 'center',
    paddingVertical: 16,
  },
  backHomeText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PhotoReviewScreen; 