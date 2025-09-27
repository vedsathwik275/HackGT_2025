import { ImageProcessor } from './ImageProcessor.js';
import { NFLField } from './NFLField.js';
import { DataManager } from './DataManager.js';

class NFLFieldMapper {
    constructor() {
        this.imageProcessor = new ImageProcessor();
        this.nflField = new NFLField();
        this.dataManager = new DataManager(this.nflField);
        
        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Detection button
        document.getElementById('detectPlayers').addEventListener('click', () => {
            this.imageProcessor.detectPlayersInImage();
        });

        // Sample data button
        document.getElementById('loadSample').addEventListener('click', () => {
            this.imageProcessor.loadSampleData();
        });

        // JSON file upload button
        document.getElementById('loadJsonFile').addEventListener('click', () => {
            document.getElementById('jsonFileInput').click();
        });

        // Clear all button
        document.getElementById('clearField').addEventListener('click', () => {
            this.clearAll();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle window resize for responsive field
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT') return;

        switch (e.key.toLowerCase()) {
            case 'd':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.imageProcessor.detectPlayersInImage();
                }
                break;
            case 's':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.imageProcessor.loadSampleData();
                }
                break;
            case 'c':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.clearAll();
                }
                break;
            case 'escape':
                this.clearHighlights();
                break;
        }
    }

    handleWindowResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.adjustFieldForMobile();
        }, 250);
    }

    adjustFieldForMobile() {
        const field = document.getElementById('nflField');
        const container = field.parentElement;
        const containerWidth = container.clientWidth;
        
        // Adjust field size for mobile screens
        if (containerWidth < 1000) {
            const scale = containerWidth / 1000;
            field.style.transform = `scale(${scale})`;
            field.style.transformOrigin = 'top left';
            container.style.height = `${533 * scale}px`;
        } else {
            field.style.transform = 'none';
            container.style.height = '533px';
        }
    }

    clearHighlights() {
        // Clear table highlights
        document.querySelectorAll('#detectionTable tr').forEach(row => {
            row.classList.remove('bg-blue-100');
        });

        // Clear field highlights
        document.querySelectorAll('.field-marker circle').forEach(circle => {
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('opacity', '0.8');
        });
    }

    clearAll() {
        this.imageProcessor.resetImagePreview();
        this.nflField.clearDetections();
        this.dataManager.clearAll();
        
        // Clear JSON file input
        document.getElementById('jsonFileInput').value = '';
        
        // Show success message
        this.showSuccessMessage('All data cleared successfully!');
    }

    showWelcomeMessage() {
        // Show a subtle welcome message on first load
        setTimeout(() => {
            this.showInfoMessage('Welcome! Upload an image or load sample data to get started.', 3000);
        }, 1000);
    }

    showSuccessMessage(message) {
        this.showTemporaryMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showTemporaryMessage(message, 'error');
    }

    showInfoMessage(message, duration = 5000) {
        this.showTemporaryMessage(message, 'info', duration);
    }

    showTemporaryMessage(message, type, duration = 5000) {
        const existingMessage = document.getElementById('tempMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.id = 'tempMessage';
        
        let bgColor = 'bg-blue-500';
        if (type === 'success') bgColor = 'bg-green-500';
        if (type === 'error') bgColor = 'bg-red-500';
        if (type === 'info') bgColor = 'bg-blue-500';
        
        messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${bgColor} text-white max-w-sm`;
        messageDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, duration);
    }

    // Public methods for external access
    getImageProcessor() {
        return this.imageProcessor;
    }

    getNFLField() {
        return this.nflField;
    }

    getDataManager() {
        return this.dataManager;
    }

    // Utility method to export current state
    exportCurrentState() {
        return {
            detections: this.dataManager.exportData(),
            imageDimensions: this.imageProcessor.getImageDimensions(),
            fieldDimensions: {
                width: this.nflField.fieldWidth,
                height: this.nflField.fieldHeight
            }
        };
    }

    // Method to import state (for future enhancement)
    importState(state) {
        if (state.detections && state.detections.detections) {
            // Simulate receiving detections
            window.dispatchEvent(new CustomEvent('detectionsReceived', {
                detail: {
                    data: { predictions: state.detections.detections },
                    imageDimensions: state.imageDimensions || { width: 1280, height: 600 }
                }
            }));
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make the app instance globally available for debugging
    window.nflFieldMapper = new NFLFieldMapper();
    
    // Add some helpful console messages for developers
    console.log('🏈 NFL Field Detection Mapper initialized');
    console.log('Available keyboard shortcuts:');
    console.log('  Ctrl+D / Cmd+D: Detect players');
    console.log('  Ctrl+S / Cmd+S: Load sample data');
    console.log('  Ctrl+C / Cmd+C: Clear all');
    console.log('  Escape: Clear highlights');
    console.log('Access the app instance via: window.nflFieldMapper');
});