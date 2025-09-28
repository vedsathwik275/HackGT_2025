import { useState, useCallback, useMemo, useEffect } from 'react';
import CoordinateMapperService from '../services/CoordinateMapperService';
import CoordinateMapperApiClient from '../services/CoordinateMapperApiClient';

const useDetectionData = () => {
    const [detections, setDetections] = useState([]);
    const [mappedData, setMappedData] = useState(null);
    const [lineOfScrimmage, setLineOfScrimmage] = useState(null);
    const [fieldDimensions, setFieldDimensions] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 1280, height: 600 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(null);
    const [backendStatus, setBackendStatus] = useState('unknown'); // 'online', 'offline', 'unknown'
    const [processingMode, setProcessingMode] = useState('auto'); // 'backend', 'local', 'auto'

    // Initialize coordinate mapper services
    const coordinateMapper = useMemo(() => new CoordinateMapperService(), []);
    const apiClient = useMemo(() => new CoordinateMapperApiClient(), []);

    // Check backend connectivity on mount
    useEffect(() => {
        const checkBackendHealth = async () => {
            try {
                const healthResult = await apiClient.healthCheck();
                setBackendStatus('online');
                console.log('🟢 Backend API is available:', healthResult);
            } catch (error) {
                setBackendStatus('offline');
                console.log('🔴 Backend API is offline, will use local processing:', error.message);
            }
        };

        checkBackendHealth();
    }, [apiClient]);

    // Process detections using backend API or local processing
    const processDetectionsWithBackend = useCallback(async (detectionData) => {
        try {
            console.log('🌐 Processing with backend API...');
            const result = await apiClient.processDetections(detectionData);
            
            // Backend returns the full result structure
            return {
                mappedData: result.mappedData,
                lineOfScrimmageX: result.lineOfScrimmageX,
                fieldDims: result.fieldDimensions
            };
        } catch (error) {
            console.error('Backend processing failed:', error);
            throw error;
        }
    }, [apiClient]);

    // Process detections using local service
    const processDetectionsLocally = useCallback((detectionData) => {
        console.log('🏠 Processing locally...');
        return coordinateMapper.processDetections(detectionData);
    }, [coordinateMapper]);

    // Main processing function that chooses backend vs local
    const processDetections = useCallback(async (newDetections, imgDimensions = null) => {
        setIsProcessing(true);
        
        try {
            setDetections(newDetections);
            if (imgDimensions) {
                setImageDimensions(imgDimensions);
            }

            // Map coordinates if we have detections
            if (newDetections && newDetections.length > 0) {
                const detectionData = { predictions: newDetections };
                let coordinateResults;

                // Choose processing method based on mode and backend status
                if (processingMode === 'local') {
                    coordinateResults = processDetectionsLocally(detectionData);
                } else if (processingMode === 'backend') {
                    coordinateResults = await processDetectionsWithBackend(detectionData);
                } else { // auto mode
                    if (backendStatus === 'online') {
                        try {
                            coordinateResults = await processDetectionsWithBackend(detectionData);
                        } catch (error) {
                            console.log('🔄 Backend failed, falling back to local processing');
                            setBackendStatus('offline');
                            coordinateResults = processDetectionsLocally(detectionData);
                        }
                    } else {
                        coordinateResults = processDetectionsLocally(detectionData);
                    }
                }
                
                setMappedData(coordinateResults.mappedData);
                setLineOfScrimmage(coordinateResults.lineOfScrimmageX);
                setFieldDimensions(coordinateResults.fieldDims);
            } else {
                setMappedData(null);
                setLineOfScrimmage(null);
                setFieldDimensions(null);
            }
        } catch (error) {
            console.error('Error processing detections:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [coordinateMapper, apiClient, backendStatus, processingMode, processDetectionsWithBackend, processDetectionsLocally]);

    // Clear all data
    const clearAll = useCallback(() => {
        setDetections([]);
        setMappedData(null);
        setLineOfScrimmage(null);
        setFieldDimensions(null);
        setHighlightedIndex(null);
        setIsProcessing(false);
    }, []);

    // Highlight a detection
    const highlightDetection = useCallback((index) => {
        setHighlightedIndex(index);
    }, []);

    // Clear highlights
    const clearHighlights = useCallback(() => {
        setHighlightedIndex(null);
    }, []);

    // Export mapped data (with backend integration)
    const exportMappedData = useCallback(async () => {
        if (!mappedData) {
            throw new Error('No mapped data available');
        }
        
        try {
            // Try backend export first if available
            if (backendStatus === 'online' && processingMode !== 'local') {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `football_coordinates_${timestamp}.json`;
                
                try {
                    const exportResult = await apiClient.exportToJSON(mappedData, filename);
                    console.log('✅ Data exported to backend:', exportResult);
                    
                    // Optionally download the file
                    const downloadUrl = apiClient.getDownloadUrl(filename);
                    window.open(downloadUrl, '_blank');
                    return;
                } catch (error) {
                    console.log('🔄 Backend export failed, falling back to local export');
                }
            }
            
            // Fallback to local export
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `football_coordinates_${timestamp}.json`;
            coordinateMapper.exportToJSON(mappedData, filename);
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }, [mappedData, coordinateMapper, apiClient, backendStatus, processingMode]);

    // Set processing mode
    const setProcessingModeCallback = useCallback((mode) => {
        setProcessingMode(mode);
        console.log(`🔧 Processing mode set to: ${mode}`);
    }, []);

    // Test backend connection
    const testBackendConnection = useCallback(async () => {
        try {
            const result = await apiClient.testConnection();
            setBackendStatus(result.connected ? 'online' : 'offline');
            return result;
        } catch (error) {
            setBackendStatus('offline');
            throw error;
        }
    }, [apiClient]);

    // Calculate statistics
    const statistics = useMemo(() => {
        // Define position arrays to match the service
        const offensivePositions = ['QB', 'RB', 'FB', 'WR', 'TE', 'C', 'OG', 'OT'];
        const defensivePositions = ['DE', 'DT', 'NT', 'LB', 'MLB', 'OLB', 'CB', 'DB', 'S', 'FS', 'SS'];
        const specialPositions = ['K', 'P', 'LS', 'KR', 'PR'];
        
        const isPlayer = (d) => offensivePositions.includes(d.class) || 
                               defensivePositions.includes(d.class) || 
                               specialPositions.includes(d.class);
        
        const players = detections.filter(d => isPlayer(d));
        const refs = detections.filter(d => d.class === 'ref');
        const totalConfidence = detections.reduce((sum, d) => sum + d.confidence, 0);
        const avgConfidence = detections.length > 0 ? (totalConfidence / detections.length) : 0;

        return {
            playerCount: players.length,
            refCount: refs.length,
            totalCount: detections.length,
            avgConfidence: Math.round(avgConfidence * 100),
            offenseCount: mappedData?.teamStats?.offenseCount || 0,
            defenseCount: mappedData?.teamStats?.defenseCount || 0,
            teamBalance: mappedData?.teamStats?.teamBalance || 'unknown'
        };
    }, [detections, mappedData]);

    // Get team-specific data
    const getOffensivePlayers = useCallback(() => {
        if (!mappedData) return [];
        return mappedData.players.filter(p => p.team === 'offense');
    }, [mappedData]);

    const getDefensivePlayers = useCallback(() => {
        if (!mappedData) return [];
        return mappedData.players.filter(p => p.team === 'defense');
    }, [mappedData]);

    // Get detection by ID
    const getDetectionById = useCallback((id) => {
        return detections.find(d => d.detection_id === id);
    }, [detections]);

    // Get mapped player by detection ID
    const getMappedPlayerById = useCallback((id) => {
        if (!mappedData) return null;
        return mappedData.players.find(p => p.detectionId === id);
    }, [mappedData]);

    return {
        // State
        detections,
        mappedData,
        lineOfScrimmage,
        fieldDimensions,
        imageDimensions,
        isProcessing,
        highlightedIndex,
        statistics,
        backendStatus,
        processingMode,

        // Actions
        processDetections,
        clearAll,
        highlightDetection,
        clearHighlights,
        exportMappedData,
        setProcessingModeCallback,
        testBackendConnection,

        // Getters
        getOffensivePlayers,
        getDefensivePlayers,
        getDetectionById,
        getMappedPlayerById,

        // Utils
        coordinateMapper,
        apiClient
    };
};

export default useDetectionData; 