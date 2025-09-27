import React, { useCallback, useEffect, useState } from 'react';
import useDetectionData from './hooks/useDetectionData';
import useImageProcessor from './hooks/useImageProcessor';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ProcessingStatus from './components/ProcessingStatus';
import StatsPanel from './components/StatsPanel';
import FieldVisualization from './components/FieldVisualization';
import NotificationManager from './components/NotificationManager';
import PlayerInfoPanel from './components/PlayerInfoPanel';
import BackendConnectionStatus from './components/BackendConnectionStatus';
import BackendConfigModal from './components/BackendConfigModal';

function App() {
    const detectionData = useDetectionData();
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    
    // Image processor with callback for when detections are received
    const handleDetectionsReceived = useCallback(async (detections, imgDimensions) => {
        await detectionData.processDetections(detections, imgDimensions);
    }, [detectionData]);

    const imageProcessor = useImageProcessor(handleDetectionsReceived);

    // Backend connection handlers
    const handleTestConnection = useCallback(async () => {
        return await detectionData.testBackendConnection();
    }, [detectionData]);

    const handleConfigureBackend = useCallback(() => {
        setIsConfigModalOpen(true);
    }, []);

    const handleProcessingModeChange = useCallback((mode) => {
        detectionData.setProcessingModeCallback(mode);
    }, [detectionData]);

    const handleConfigurationSaved = useCallback(async (newUrl) => {
        console.log(`🔧 Backend URL configured: ${newUrl}`);
        // Re-test connection with new URL
        try {
            await detectionData.testBackendConnection();
        } catch (error) {
            console.error('Failed to test new connection:', error);
        }
    }, [detectionData]);

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
            console.log('🌐 Backend API integration enabled');
            console.log('Available keyboard shortcuts:');
            console.log('  Ctrl+D / Cmd+D: Detect players');
            console.log('  Ctrl+S / Cmd+S: Load sample data');
            console.log('  Ctrl+C / Cmd+C: Clear all');
            console.log('  Ctrl+E / Cmd+E: Export coordinates');
            console.log('  Escape: Clear highlights');
            console.log('Backend features:');
            console.log('  🔄 Auto mode: Uses backend when available, falls back to local');
            console.log('  🌐 Backend mode: All processing on backend server');
            console.log('  🏠 Local mode: All processing in browser');
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="container mx-auto p-6">
                <Header />
                
                <BackendConnectionStatus
                    backendStatus={detectionData.backendStatus}
                    processingMode={detectionData.processingMode}
                    onProcessingModeChange={handleProcessingModeChange}
                    onTestConnection={handleTestConnection}
                    onConfigureBackend={handleConfigureBackend}
                />
                
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
            
            {/* Player Info Panel */}
            {detectionData.highlightedIndex !== null && detectionData.detections[detectionData.highlightedIndex] && (
                <PlayerInfoPanel
                    detection={detectionData.detections[detectionData.highlightedIndex]}
                    mappedPlayer={detectionData.getMappedPlayerById(detectionData.detections[detectionData.highlightedIndex]?.detection_id)}
                    onClose={detectionData.clearHighlights}
                />
            )}
            
            <NotificationManager />
            
            {/* Backend Configuration Modal */}
            <BackendConfigModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                apiClient={detectionData.apiClient}
                onConfigurationSaved={handleConfigurationSaved}
            />
        </div>
    );
}

export default App; 