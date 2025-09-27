import { useState, useCallback, useMemo } from 'react';
import CoordinateMapperApiClient from '../services/CoordinateMapperApiClient';

const useDetectionData = () => {
  const [detections, setDetections] = useState([]);
  const [mappedData, setMappedData] = useState(null);
  const [lineOfScrimmage, setLineOfScrimmage] = useState(null);
  const [fieldDimensions, setFieldDimensions] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1280, height: 600 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);

  // Initialize API client
  const apiClient = useMemo(() => new CoordinateMapperApiClient(), []);

  // Process new detections and map coordinates
  const processDetections = useCallback(async (newDetections, imgDimensions = null) => {
    setIsProcessing(true);
    
    try {
      setDetections(newDetections);
      if (imgDimensions) {
        setImageDimensions(imgDimensions);
      }

      console.log('📊 Raw Roboflow Predictions:', JSON.stringify(newDetections, null, 2));

      // Map coordinates if we have detections
      if (newDetections && newDetections.length > 0) {
        const detectionData = { predictions: newDetections };
        
        console.log('➡️ Calling backend to process detections...');
        const coordinateResults = await apiClient.processDetections(detectionData);
        console.log('✅ Backend processed detections:', coordinateResults);
        
        // Expected fields: mappedData, lineOfScrimmageX, fieldDims
        setMappedData(coordinateResults.mappedData || null);
        setLineOfScrimmage(coordinateResults.lineOfScrimmageX ?? null);
        setFieldDimensions(coordinateResults.fieldDims || null);
        
        if (global.showNotification) {
          global.showNotification('✅ Coordinates processed successfully!', 'success');
        }
      } else {
        setMappedData(null);
        setLineOfScrimmage(null);
        setFieldDimensions(null);
        
        if (global.showNotification) {
          global.showNotification('❌ No players detected in image', 'error');
        }
      }
    } catch (error) {
      console.error('Error processing detections:', error);
      
      let errorMessage = 'Error processing detections';
      if (error.message.includes('Unable to connect')) {
        errorMessage = '🔌 Backend server offline. Please start the server.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = '📡 Network error. Check your connection.';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      
      if (global.showNotification) {
        global.showNotification(errorMessage, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [apiClient]);

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

  // Export mapped data
  const exportMappedData = useCallback(async () => {
    if (!mappedData) {
      if (global.showNotification) {
        global.showNotification('❌ No mapped data available to export', 'error');
      }
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `football_coordinates_${timestamp}.json`;
      
      // Make API call to export data
      const result = await apiClient.exportToJSON(mappedData, filename);
      
      if (global.showNotification) {
        global.showNotification(`📁 Data exported: ${result.filename}`, 'success');
      }
      
      // Return the result for potential sharing
      return {
        success: true,
        filename: result.filename,
        downloadUrl: apiClient.getDownloadUrl(result.filename),
        size: result.size
      };
    } catch (error) {
      console.error('Export error:', error);
      
      let errorMessage = 'Export failed';
      if (error.message.includes('Unable to connect')) {
        errorMessage = '🔌 Backend server offline. Cannot export data.';
      } else {
        errorMessage = `❌ Export failed: ${error.message}`;
      }
      
      if (global.showNotification) {
        global.showNotification(errorMessage, 'error');
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }, [mappedData, apiClient]);

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

    // Actions
    processDetections,
    clearAll,
    highlightDetection,
    clearHighlights,
    exportMappedData,

    // Getters
    getOffensivePlayers,
    getDefensivePlayers,
    getDetectionById,
    getMappedPlayerById,

    // Utils
    apiClient
  };
};

export default useDetectionData;
