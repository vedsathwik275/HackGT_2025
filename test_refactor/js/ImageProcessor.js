import { MapCoordinates } from './MapCoordinates.js';

export class ImageProcessor {
    constructor() {
        this.API_KEY = "Imm66rNLdtpVKJSwH4Cl"; // Replace with your Roboflow API key
        this.API_URL = "https://serverless.roboflow.com/all-football/1";
        this.currentImage = null;
        this.originalImageDimensions = { width: 1280, height: 600 };
        this.mapCoordinates = new MapCoordinates();
        this.lastMappedData = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Image upload
        document.getElementById('imageFile').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // JSON file upload
        document.getElementById('jsonFileInput').addEventListener('change', (e) => {
            this.loadJsonFile(e.target.files[0]);
        });

        // Export mapped coordinates
        document.addEventListener('DOMContentLoaded', () => {
            const exportButton = document.getElementById('exportMappedData');
            if (exportButton) {
                exportButton.addEventListener('click', () => {
                    this.exportMappedCoordinates();
                });
            }
        });
    }

    handleImageUpload(file) {
        if (!file) return;

        this.currentImage = file;
        const detectButton = document.getElementById('detectPlayers');
        
        // Enable detect button
        detectButton.disabled = false;
        detectButton.classList.remove('opacity-50');

        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.getElementById('imagePreviewContainer');
            container.innerHTML = `<img src="${e.target.result}" class="image-preview" alt="Uploaded image">`;
            
            // Get image dimensions for mapping
            const img = new Image();
            img.onload = () => {
                this.originalImageDimensions = { width: img.width, height: img.height };
                console.log('Image dimensions:', this.originalImageDimensions);
                
                // Dispatch custom event with image dimensions
                window.dispatchEvent(new CustomEvent('imageDimensionsChanged', {
                    detail: this.originalImageDimensions
                }));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async detectPlayersInImage() {
        if (!this.currentImage) {
            this.showErrorMessage('Please upload an image first');
            return;
        }

        this.showProcessingStatus(true, 'Converting image to base64...');
        
        try {
            // Convert image to base64
            const base64Image = await this.imageToBase64(this.currentImage);
            
            this.showProcessingStatus(true, 'Sending to detection service...');
            
            // Make API request
            const response = await fetch(`${this.API_URL}?api_key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: base64Image
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            this.showProcessingStatus(true, 'Processing detection results...');
            
            const data = await response.json();
            
            // Process coordinate mapping
            this.showProcessingStatus(true, 'Mapping coordinates to field positions...');
            const coordinateResults = this.processCoordinateMapping(data);
            
            this.showProcessingStatus(false);
            
            // Dispatch event with detection results and mapped coordinates
            window.dispatchEvent(new CustomEvent('detectionsReceived', {
                detail: { 
                    data, 
                    imageDimensions: this.originalImageDimensions,
                    mappedData: coordinateResults.mappedData,
                    lineOfScrimmage: coordinateResults.lineOfScrimmageX,
                    fieldDimensions: coordinateResults.fieldDims
                }
            }));
            
            // Show success message
            this.showSuccessMessage(`Successfully detected ${data.predictions.length} objects and mapped coordinates!`);

        } catch (error) {
            this.showProcessingStatus(false);
            this.showErrorMessage('Detection failed: ' + error.message);
            console.error('Detection error:', error);
        }
    }

    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data:image/jpeg;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    loadJsonFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Process coordinate mapping
                const coordinateResults = this.processCoordinateMapping(data);
                
                // Dispatch event with JSON data and mapped coordinates
                window.dispatchEvent(new CustomEvent('detectionsReceived', {
                    detail: { 
                        data, 
                        imageDimensions: this.originalImageDimensions,
                        mappedData: coordinateResults.mappedData,
                        lineOfScrimmage: coordinateResults.lineOfScrimmageX,
                        fieldDimensions: coordinateResults.fieldDims
                    }
                }));
                
                this.showSuccessMessage('JSON file loaded and coordinates mapped successfully!');
            } catch (error) {
                this.showErrorMessage('Error parsing JSON file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    loadSampleData() {
        const sampleData = {
            "predictions": [
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
            ]
        };
        
        this.originalImageDimensions = { width: 1280, height: 600 };
        
        // Process coordinate mapping for sample data
        const coordinateResults = this.processCoordinateMapping(sampleData);
        
        // Dispatch event with sample data and mapped coordinates
        window.dispatchEvent(new CustomEvent('detectionsReceived', {
            detail: { 
                data: sampleData, 
                imageDimensions: this.originalImageDimensions,
                mappedData: coordinateResults.mappedData,
                lineOfScrimmage: coordinateResults.lineOfScrimmageX,
                fieldDimensions: coordinateResults.fieldDims
            }
        }));
        
        this.showSuccessMessage('Sample data loaded and coordinates mapped successfully!');
    }

    showProcessingStatus(show, message = '') {
        const statusDiv = document.getElementById('processingStatus');
        const messageDiv = document.getElementById('processingMessage');
        const detectButton = document.getElementById('detectPlayers');
        const spinner = detectButton.querySelector('.loading-spinner');
        const buttonText = detectButton.querySelector('.button-text');
        
        if (show) {
            statusDiv.classList.remove('hidden');
            messageDiv.textContent = message;
            detectButton.disabled = true;
            spinner.classList.remove('hidden');
            buttonText.textContent = 'Processing...';
        } else {
            statusDiv.classList.add('hidden');
            detectButton.disabled = false;
            spinner.classList.add('hidden');
            buttonText.textContent = '🔍 Detect Players';
        }
    }

    showSuccessMessage(message) {
        this.showTemporaryMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showTemporaryMessage(message, 'error');
    }

    showTemporaryMessage(message, type) {
        const existingMessage = document.getElementById('tempMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.id = 'tempMessage';
        messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    resetImagePreview() {
        this.currentImage = null;
        document.getElementById('imageFile').value = '';
        document.getElementById('imagePreviewContainer').innerHTML = `
            <div class="text-gray-500">
                <svg class="mx-auto h-12 w-12 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>No image selected</p>
            </div>
        `;
        
        const detectButton = document.getElementById('detectPlayers');
        detectButton.disabled = true;
        detectButton.classList.add('opacity-50');
    }

    getImageDimensions() {
        return this.originalImageDimensions;
    }

    processCoordinateMapping(data) {
        try {
            const coordinateResults = this.mapCoordinates.processDetections(data);
            this.lastMappedData = coordinateResults;
            return coordinateResults;
        } catch (error) {
            console.error('Error mapping coordinates:', error);
            this.showErrorMessage('Error mapping coordinates: ' + error.message);
            return { mappedData: null, lineOfScrimmageX: null, fieldDims: null };
        }
    }

    exportMappedCoordinates() {
        if (!this.lastMappedData || !this.lastMappedData.mappedData) {
            this.showErrorMessage('No mapped coordinate data available. Please process detections first.');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `football_coordinates_${timestamp}.json`;
        
        try {
            this.mapCoordinates.downloadJSON(this.lastMappedData.mappedData, filename);
            this.showSuccessMessage(`Exported mapped coordinates to ${filename}`);
        } catch (error) {
            this.showErrorMessage('Error exporting coordinates: ' + error.message);
        }
    }

    getLastMappedData() {
        return this.lastMappedData;
    }
}