import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

const useImageProcessor = (onDetectionsReceived) => {
  const [currentImage, setCurrentImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1280, height: 600 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // API Configuration
  const API_KEY = "yZbcFKL4HirN2zbDStgm";
  const API_URL = "https://serverless.roboflow.com/football-players-fom0k/11";

  // Handle image file upload
  const handleImageUpload = useCallback((file) => {
    if (!file) return;

    setCurrentImage(file);

    // Set image dimensions if provided, otherwise use defaults
    if (file.width && file.height) {
      setImageDimensions({ width: file.width, height: file.height });
    } else {
      setImageDimensions({ width: 1280, height: 600 }); // Default dimensions
    }
  }, []);

  // Convert image to base64
  const imageToBase64 = useCallback(async (file) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  }, []);

  // Detect players in uploaded image
  const detectPlayersInImage = useCallback(async () => {
    if (!currentImage) {
      throw new Error('Please upload an image first');
    }

    setIsProcessing(true);
    setProcessingMessage('Converting image to base64...');

    try {
      const base64Image = await imageToBase64(currentImage);
      setProcessingMessage('Sending to detection service...');

      const response = await fetch(`${API_URL}?api_key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: base64Image
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      setProcessingMessage('Processing detection results...');
      const data = await response.json();

      setProcessingMessage('Mapping coordinates to field positions...');
      
      // Call the callback with the detection results
      if (onDetectionsReceived) {
        await onDetectionsReceived(data.predictions || [], imageDimensions);
      }

      // Show success notification
      if (global.showNotification) {
        global.showNotification(
          `Successfully detected ${data.predictions?.length || 0} objects!`,
          'success'
        );
      }

    } catch (error) {
      console.error('Detection error:', error);
      if (global.showNotification) {
        global.showNotification(`Detection failed: ${error.message}`, 'error');
      }
      throw error;
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  }, [currentImage, imageDimensions, onDetectionsReceived, API_URL, API_KEY, imageToBase64]);

  // Load JSON file
  const loadJsonFile = useCallback(async (file) => {
    if (!file) return;

    try {
      const jsonString = await FileSystem.readAsStringAsync(file.uri);
      const data = JSON.parse(jsonString);
      
      if (onDetectionsReceived) {
        await onDetectionsReceived(data.predictions || [], imageDimensions);
      }

      if (global.showNotification) {
        global.showNotification('JSON file loaded successfully!', 'success');
      }
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      if (global.showNotification) {
        global.showNotification(`Error loading JSON: ${error.message}`, 'error');
      }
      throw error;
    }
  }, [imageDimensions, onDetectionsReceived]);

  // Load sample data with new position-based structure
  const loadSampleData = useCallback(async () => {
    const sampleData = [
      {"x": 1246, "y": 362, "width": 48, "height": 96, "confidence": 0.899, "class": "S", "class_id": 11, "detection_id": "bfa18b47-d8be-46fe-8534-f31663204e24"},
      {"x": 755.5, "y": 548, "width": 51, "height": 96, "confidence": 0.895, "class": "DB", "class_id": 1, "detection_id": "2d714571-c20d-4707-b562-d6db6acf0f78"},
      {"x": 552.5, "y": 95.5, "width": 49, "height": 73, "confidence": 0.89, "class": "WR", "class_id": 14, "detection_id": "b12abd8a-c86f-4995-8726-bc458d70343a"},
      {"x": 776, "y": 96.5, "width": 34, "height": 79, "confidence": 0.873, "class": "DB", "class_id": 1, "detection_id": "64c2a0f4-fa0a-4499-8706-a4fbbc4b9121"},
      {"x": 634, "y": 290, "width": 52, "height": 92, "confidence": 0.869, "class": "LB", "class_id": 5, "detection_id": "9152b90e-0d50-4936-93aa-d3d340818225"},
      {"x": 681, "y": 376, "width": 50, "height": 90, "confidence": 0.865, "class": "LB", "class_id": 5, "detection_id": "55217790-e3b4-4498-bc95-8bde03bc75d2"},
      {"x": 194, "y": 373, "width": 40, "height": 108, "confidence": 0.861, "class": "QB", "class_id": 8, "detection_id": "c62925d8-ddf5-4d76-b09a-325584c49b29"},
      {"x": 550, "y": 231.5, "width": 66, "height": 71, "confidence": 0.859, "class": "WR", "class_id": 14, "detection_id": "ff0b79c9-3512-4810-b8a7-df6c88f7ca9b"},
      {"x": 575, "y": 314, "width": 64, "height": 70, "confidence": 0.818, "class": "DE", "class_id": 2, "detection_id": "1ab64f53-1bc4-4182-bc6b-297ecf96ba41"},
      {"x": 225, "y": 326, "width": 40, "height": 80, "confidence": 0.81, "class": "RB", "class_id": 9, "detection_id": "631847ef-67ef-4441-9c61-2e61b09901f3"}
    ];

    const sampleDimensions = { width: 1280, height: 600 };
    setImageDimensions(sampleDimensions);

    if (onDetectionsReceived) {
      await onDetectionsReceived(sampleData, sampleDimensions);
    }

    if (global.showNotification) {
      global.showNotification('Sample data loaded successfully!', 'success');
    }
  }, [onDetectionsReceived]);

  // Reset image preview
  const resetImagePreview = useCallback(() => {
    setCurrentImage(null);
  }, []);

  return {
    // State
    currentImage,
    imageDimensions,
    isProcessing,
    processingMessage,

    // Actions
    handleImageUpload,
    detectPlayersInImage,
    loadJsonFile,
    loadSampleData,
    resetImagePreview,

    // Utils
    imageToBase64,
  };
};

export default useImageProcessor;
