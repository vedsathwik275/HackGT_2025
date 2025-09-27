import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

const CameraScreen = ({ onNavigate, onPhotoTaken }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isReady, setIsReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const takePicture = async () => {
    if (!cameraRef.current || !isReady) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      console.log('📷 Original photo captured:', {
        width: photo.width,
        height: photo.height,
        uri: photo.uri
      });

      // Crop the image to the guide frame area (80% width, 60% height, centered)
      const cropWidth = photo.width * 0.8;
      const cropHeight = photo.height * 0.6;
      const cropX = (photo.width - cropWidth) / 2;
      const cropY = (photo.height - cropHeight) / 2;

      console.log('✂️ Cropping image to guide frame:', {
        cropX: Math.round(cropX),
        cropY: Math.round(cropY),
        cropWidth: Math.round(cropWidth),
        cropHeight: Math.round(cropHeight)
      });

      const croppedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: Math.round(cropX),
              originY: Math.round(cropY),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            },
          },
        ],
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      console.log('✅ Cropped image ready for preview:', {
        width: croppedImage.width,
        height: croppedImage.height,
        uri: croppedImage.uri
      });

      // Call the callback with the cropped photo data
      if (onPhotoTaken) {
        onPhotoTaken(croppedImage);
      }

      // Navigate to photo review screen
      onNavigate('photoReview');
    } catch (error) {
      console.error('Error taking/cropping picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const flipCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => onNavigate('home')}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setIsReady(true)}
      >
        <View style={styles.overlay}>
          {/* Top controls */}
          <View style={styles.topControls}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => onNavigate('home')}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.flipButton} onPress={flipCamera}>
              <Text style={styles.flipButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Center guide */}
          <View style={styles.centerGuide}>
            <Text style={styles.guideText}>Position the field in the frame</Text>
            <Text style={styles.topIndicator}>TOP: One sideline should be at the top of your screen</Text>
            <View style={styles.guideBorder} />
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity 
              style={[styles.captureButton, !isReady && styles.captureButtonDisabled]} 
              onPress={takePicture}
              disabled={!isReady}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 20,
  },
  centerGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  topIndicator: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  guideBorder: {
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  bottomControls: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});

export default CameraScreen; 