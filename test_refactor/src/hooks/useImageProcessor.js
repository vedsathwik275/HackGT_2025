import { useState, useCallback, useRef } from 'react';

const useImageProcessor = (onDetectionsReceived) => {
    const [currentImage, setCurrentImage] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 1280, height: 600 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const fileInputRef = useRef(null);
    const jsonInputRef = useRef(null);

    // API Configuration
    const API_KEY = "Imm66rNLdtpVKJSwH4Cl";
    const API_URL = "https://serverless.roboflow.com/all-football/1";

    // Handle image file upload
    const handleImageUpload = useCallback((file) => {
        if (!file) return;

        setCurrentImage(file);

        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                setImageDimensions({ width: img.width, height: img.height });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }, []);

    // Convert image to base64
    const imageToBase64 = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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

        } catch (error) {
            console.error('Detection error:', error);
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
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (onDetectionsReceived) {
                await onDetectionsReceived(data.predictions || [], imageDimensions);
            }
        } catch (error) {
            console.error('Error parsing JSON file:', error);
            throw error;
        }
    }, [imageDimensions, onDetectionsReceived]);

    // Load sample data
    const loadSampleData = useCallback(async () => {
        const sampleData = [
            {"x": 756.5, "y": 550, "width": 61, "height": 100, "confidence": 0.92, "class": "player", "class_id": 0, "detection_id": "a03d99a8-2c4a-4080-84bd-1190b511088b"},
            {"x": 548, "y": 232.5, "width": 76, "height": 77, "confidence": 0.918, "class": "player", "class_id": 0, "detection_id": "711a3324-5fa7-4026-9ea7-3d01c1ee7694"},
            {"x": 546.5, "y": 96.5, "width": 65, "height": 79, "confidence": 0.916, "class": "player", "class_id": 0, "detection_id": "a26a87d0-51d7-4a7d-8fdd-58489c4002cc"},
            {"x": 561, "y": 408, "width": 74, "height": 104, "confidence": 0.913, "class": "player", "class_id": 0, "detection_id": "8069ac76-7a4b-421e-8853-b10af6d0cbb6"},
            {"x": 575, "y": 314.5, "width": 86, "height": 81, "confidence": 0.912, "class": "player", "class_id": 0, "detection_id": "3d7fcade-14f3-4fc0-abcc-563641b72618"},
            {"x": 986, "y": 217, "width": 50, "height": 98, "confidence": 0.909, "class": "player", "class_id": 0, "detection_id": "d248b7c8-a331-4b90-abd2-4ae8d9134ed7"},
            {"x": 640.5, "y": 291, "width": 71, "height": 98, "confidence": 0.908, "class": "player", "class_id": 0, "detection_id": "a604e466-716f-4d02-acd1-be0ee9c543ad"},
            {"x": 1245.5, "y": 365, "width": 53, "height": 102, "confidence": 0.908, "class": "player", "class_id": 0, "detection_id": "f3a23aaa-33fe-4fa0-a6f6-114724568237"},
            {"x": 1021.5, "y": 397, "width": 33, "height": 126, "confidence": 0.873, "class": "ref", "class_id": 1, "detection_id": "0eecc7c0-73f5-4187-9bd7-c56de9e2a492"},
            {"x": 683, "y": 29, "width": 36, "height": 58, "confidence": 0.532, "class": "ref", "class_id": 1, "detection_id": "c9fe098b-206f-40d2-846b-8755f3b4bd3a"}
        ];

        const sampleDimensions = { width: 1280, height: 600 };
        setImageDimensions(sampleDimensions);

        if (onDetectionsReceived) {
            await onDetectionsReceived(sampleData, sampleDimensions);
        }
    }, [onDetectionsReceived]);

    // Reset image preview
    const resetImagePreview = useCallback(() => {
        setCurrentImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (jsonInputRef.current) {
            jsonInputRef.current.value = '';
        }
    }, []);

    // Trigger file input
    const triggerFileInput = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    // Trigger JSON file input
    const triggerJsonInput = useCallback(() => {
        if (jsonInputRef.current) {
            jsonInputRef.current.click();
        }
    }, []);

    return {
        // State
        currentImage,
        imageDimensions,
        isProcessing,
        processingMessage,

        // Refs
        fileInputRef,
        jsonInputRef,

        // Actions
        handleImageUpload,
        detectPlayersInImage,
        loadJsonFile,
        loadSampleData,
        resetImagePreview,
        triggerFileInput,
        triggerJsonInput,

        // Utils
        imageToBase64,
    };
};

export default useImageProcessor; 