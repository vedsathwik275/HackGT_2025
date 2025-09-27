import React, { useCallback, useEffect } from 'react';
import useDetectionData from './hooks/useDetectionData';
import useImageProcessor from './hooks/useImageProcessor';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ProcessingStatus from './components/ProcessingStatus';
import StatsPanel from './components/StatsPanel';
import FieldVisualization from './components/FieldVisualization';
import NotificationManager from './components/NotificationManager';

function App() {
    const detectionData = useDetectionData();
    
    // Image processor with callback for when detections are received
    const handleDetectionsReceived = useCallback(async (detections, imgDimensions) => {
        await detectionData.processDetections(detections, imgDimensions);
    }, [detectionData]);

    const imageProcessor = useImageProcessor(handleDetectionsReceived);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyboardShortcuts = (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT') return;

            switch (e.key.toLowerCase()) {
                case 'd':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (imageProcessor.currentImage) {
                            imageProcessor.detectPlayersInImage().catch(console.error);
                        }
                    }
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        imageProcessor.loadSampleData().catch(console.error);
                    }
                    break;
                case 'c':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleClearAll();
                    }
                    break;
                case 'e':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (detectionData.mappedData) {
                            detectionData.exportMappedData();
                        }
                    }
                    break;
                case 'escape':
                    detectionData.clearHighlights();
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyboardShortcuts);
        return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
    }, [imageProcessor, detectionData]);

    // Clear all data
    const handleClearAll = useCallback(() => {
        imageProcessor.resetImagePreview();
        detectionData.clearAll();
    }, [imageProcessor, detectionData]);

    // Show welcome message on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('🏈 NFL Field Detection Mapper initialized');
            console.log('Available keyboard shortcuts:');
            console.log('  Ctrl+D / Cmd+D: Detect players');
            console.log('  Ctrl+S / Cmd+S: Load sample data');
            console.log('  Ctrl+C / Cmd+C: Clear all');
            console.log('  Ctrl+E / Cmd+E: Export coordinates');
            console.log('  Escape: Clear highlights');
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="container mx-auto p-6">
                <Header />
                
                <ImageUpload
                    imageProcessor={imageProcessor}
                    onClearAll={handleClearAll}
                    isProcessingDetection={detectionData.isProcessing}
                />
                
                <ProcessingStatus
                    isProcessing={imageProcessor.isProcessing}
                    message={imageProcessor.processingMessage}
                />
                
                <StatsPanel
                    statistics={detectionData.statistics}
                    fieldDimensions={detectionData.fieldDimensions}
                    lineOfScrimmage={detectionData.lineOfScrimmage}
                />
                
                <FieldVisualization
                    detections={detectionData.detections}
                    mappedData={detectionData.mappedData}
                    lineOfScrimmage={detectionData.lineOfScrimmage}
                    fieldDimensions={detectionData.fieldDimensions}
                    highlightedIndex={detectionData.highlightedIndex}
                    onMarkerClick={detectionData.highlightDetection}
                />
            </div>
            
            <NotificationManager />
        </div>
    );
}

export default App; 