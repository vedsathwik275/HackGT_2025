import React, { useCallback } from 'react';

const DetectionTable = ({ 
    detections, 
    mappedData, 
    highlightedIndex, 
    onRowClick, 
    onExportData 
}) => {
    const truncateId = useCallback((id) => {
        return id ? id.substring(0, 8) + '...' : '--';
    }, []);

    const getClassBadgeStyles = useCallback((className) => {
        return className === 'player' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-yellow-100 text-yellow-800';
    }, []);

    const getTeamBadgeStyles = useCallback((team) => {
        return team === 'offense' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800';
    }, []);

    const getConfidenceBarColor = useCallback((confidence) => {
        if (confidence >= 0.8) return 'bg-green-500';
        if (confidence >= 0.7) return 'bg-yellow-500';
        return 'bg-red-500';
    }, []);

    const capitalize = useCallback((str) => {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '--';
    }, []);

    const getFieldYardage = useCallback((x) => {
        // Simple field position calculation
        if (!x) return '--';
        const yardLine = Math.round((x / 1280) * 100); // Approximate
        return `${yardLine} yd`;
    }, []);

    const handleExport = useCallback(() => {
        try {
            onExportData && onExportData();
        } catch (error) {
            console.error('Export error:', error);
        }
    }, [onExportData]);

    if (!detections || detections.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Detection Details</h2>
                <div className="text-center py-8 text-gray-500">
                    No detections to display. Upload an image or load sample data to get started.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">📋 Detection Details</h2>
                {mappedData && (
                    <button
                        onClick={handleExport}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        📤 Export Coordinates
                    </button>
                )}
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type & Team
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Position
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Size
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Confidence
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Field Position
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {detections.map((detection, index) => {
                            // Find mapped data for this detection
                            let mappedPlayer = null;
                            let mappedRef = null;
                            let fieldCoords = '';
                            
                            if (mappedData) {
                                if (detection.class === 'player') {
                                    mappedPlayer = mappedData.players.find(p => p.detectionId === detection.detection_id);
                                    if (mappedPlayer) {
                                        fieldCoords = `(${mappedPlayer.coordinates.xYards}, ${mappedPlayer.coordinates.yYards}) yd`;
                                    }
                                } else if (detection.class === 'ref') {
                                    mappedRef = mappedData.referees.find(r => r.detectionId === detection.detection_id);
                                    if (mappedRef) {
                                        fieldCoords = `(${mappedRef.coordinates.xYards}, ${mappedRef.coordinates.yYards}) yd`;
                                    }
                                }
                            }

                            const isHighlighted = highlightedIndex === index;
                            const confidencePercent = Math.round(detection.confidence * 100);

                            return (
                                <tr
                                    key={detection.detection_id}
                                    onClick={() => onRowClick && onRowClick(index)}
                                    className={`cursor-pointer transition-colors ${
                                        isHighlighted 
                                            ? 'bg-blue-100' 
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                        {truncateId(detection.detection_id)}
                                    </td>
                                    
                                    <td className="px-4 py-3">
                                        <div className="space-y-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassBadgeStyles(detection.class)}`}>
                                                {capitalize(detection.class)}
                                            </span>
                                            {mappedPlayer && (
                                                <div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTeamBadgeStyles(mappedPlayer.team)}`}>
                                                        {capitalize(mappedPlayer.team)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        <div className="space-y-1">
                                            <div>Pixels: ({Math.round(detection.x)}, {Math.round(detection.y)})</div>
                                            {fieldCoords && (
                                                <div className="text-blue-600 font-medium">
                                                    Field: {fieldCoords}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {detection.width}×{detection.height}
                                    </td>
                                    
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[4rem]">
                                                <div 
                                                    className={`${getConfidenceBarColor(detection.confidence)} h-2 rounded-full`} 
                                                    style={{ width: `${confidencePercent}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                                                {confidencePercent}%
                                            </span>
                                        </div>
                                    </td>
                                    
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {getFieldYardage(detection.x)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {detections.length > 0 && (
                <div className="mt-4 text-sm text-gray-500 text-center">
                    Showing {detections.length} detection{detections.length !== 1 ? 's' : ''}. 
                    Click on a row to highlight the corresponding marker on the field.
                </div>
            )}
        </div>
    );
};

export default DetectionTable; 