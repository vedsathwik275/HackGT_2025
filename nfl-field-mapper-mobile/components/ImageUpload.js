import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width: screenWidth } = Dimensions.get('window');

const ImageUpload = ({ imageProcessor, onClearAll, isProcessingDetection }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

  const requestPermissions = async () => {
    // Request both camera and media library permissions
    const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
    const mediaResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraResult.status !== 'granted') {
      Alert.alert('Camera Permission needed', 'We need camera permissions to take photos.');
      return { camera: false, mediaLibrary: mediaResult.status === 'granted' };
    }
    
    if (mediaResult.status !== 'granted') {
      Alert.alert('Media Library Permission needed', 'We need camera roll permissions to select images from gallery.');
      return { camera: true, mediaLibrary: false };
    }
    
    return { camera: true, mediaLibrary: true };
  };

  const handleImagePicker = useCallback(async () => {
    const permissions = await requestPermissions();
    
    // Create alert options based on available permissions
    const alertOptions = [];
    
    if (permissions.camera) {
      alertOptions.push({
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });

          if (!result.canceled) {
            const asset = result.assets[0];
            const file = {
              uri: asset.uri,
              name: 'camera_image.jpg',
              type: 'image/jpeg',
              width: asset.width || 1280,
              height: asset.height || 600,
            };
            imageProcessor.handleImageUpload(file);
            setImagePreview(asset.uri);
            setError('');
          }
        },
      });
    }
    
    if (permissions.mediaLibrary) {
      alertOptions.push({
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });

          if (!result.canceled) {
            const asset = result.assets[0];
            const file = {
              uri: asset.uri,
              name: 'selected_image.jpg',
              type: 'image/jpeg',
              width: asset.width || 1280,
              height: asset.height || 600,
            };
            imageProcessor.handleImageUpload(file);
            setImagePreview(asset.uri);
            setError('');
          }
        },
      });
    }
    
    alertOptions.push({
      text: 'Cancel',
      style: 'cancel',
    });
    
    if (alertOptions.length > 1) {
      Alert.alert(
        'Select Image',
        'Choose how you want to select an image',
        alertOptions
      );
    } else {
      Alert.alert('No Permissions', 'Please grant camera or media library permissions to select images.');
    }
  }, [imageProcessor]);

  const handleJSONPicker = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = {
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: 'application/json',
        };
        await imageProcessor.loadJsonFile(file);
        setError('');
      }
    } catch (err) {
      setError(`Error loading JSON: ${err.message}`);
    }
  }, [imageProcessor]);

  const handleDetectPlayers = useCallback(async () => {
    try {
      await imageProcessor.detectPlayersInImage();
      setError('');
    } catch (err) {
      setError(`Detection failed: ${err.message}`);
    }
  }, [imageProcessor]);

  const handleLoadSample = useCallback(async () => {
    try {
      await imageProcessor.loadSampleData();
      setImagePreview(null); // No preview for sample data
      setError('');
    } catch (err) {
      setError(`Error loading sample data: ${err.message}`);
    }
  }, [imageProcessor]);

  const handleClearAll = useCallback(() => {
    onClearAll();
    setImagePreview(null);
    setError('');
  }, [onClearAll]);

  const dismissError = () => setError('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🖼️ Image Upload & Detection</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={dismissError} style={styles.errorDismiss}>
            <Text style={styles.errorDismissText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      
      {/* Image Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Image Preview</Text>
        <View style={styles.previewBox}>
          {imagePreview ? (
            <Image source={{ uri: imagePreview }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>📷</Text>
              <Text style={styles.placeholderSubtext}>No image selected</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleImagePicker}
          disabled={imageProcessor.isProcessing || isProcessingDetection}
        >
          <Text style={styles.primaryButtonText}>📷 Select Image</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.detectButton,
            (!imageProcessor.currentImage || imageProcessor.isProcessing) && styles.disabledButton
          ]}
          onPress={handleDetectPlayers}
          disabled={!imageProcessor.currentImage || imageProcessor.isProcessing}
        >
          <Text style={styles.detectButtonText}>
            {imageProcessor.isProcessing ? '🔄 Processing...' : '🔍 Detect Players'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Action Buttons */}
      <View style={styles.secondaryButtonContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLoadSample}
          disabled={imageProcessor.isProcessing || isProcessingDetection}
        >
          <Text style={styles.secondaryButtonText}>📂 Sample Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleJSONPicker}
          disabled={imageProcessor.isProcessing || isProcessingDetection}
        >
          <Text style={styles.secondaryButtonText}>📄 Load JSON</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearAll}
          disabled={imageProcessor.isProcessing || isProcessingDetection}
        >
          <Text style={styles.dangerButtonText}>🗑️ Clear All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#991b1b',
    flex: 1,
  },
  errorDismiss: {
    marginLeft: 12,
    padding: 4,
  },
  errorDismissText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  previewBox: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  previewImage: {
    width: screenWidth - 72,
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6b7280',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  detectButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  detectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  secondaryButtonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  secondaryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ImageUpload;
