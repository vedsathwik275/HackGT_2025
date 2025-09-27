import React, { useMemo, useCallback } from 'react';

const FieldVisualization = ({ 
    detections, 
    mappedData, 
    lineOfScrimmage, 
    fieldDimensions,
    highlightedIndex,
    onMarkerClick 
}) => {
    // Calculate field scaling for visualization
    const fieldScale = useMemo(() => {
        const baseWidth = 1000;
        const baseHeight = 533;
        return { width: baseWidth, height: baseHeight };
    }, []);

    // Convert pixel coordinates to SVG coordinates
    const pixelToSVG = useCallback((x, y, imgDimensions = { width: 1280, height: 600 }) => {
        const scaleX = fieldScale.width / imgDimensions.width;
        const scaleY = fieldScale.height / imgDimensions.height;
        return {
            x: x * scaleX,
            y: y * scaleY
        };
    }, [fieldScale]);

    // Generate yard lines
    const generateYardLines = useCallback(() => {
        const lines = [];
        const lineSpacing = fieldScale.width / 12; // 10-yard intervals plus end zones
        
        for (let i = 1; i < 12; i++) {
            const x = i * lineSpacing;
            lines.push(
                <line
                    key={`yard-${i}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={fieldScale.height}
                    className="yard-line"
                />
            );
        }
        return lines;
    }, [fieldScale]);

    // Generate hash marks
    const generateHashMarks = useCallback(() => {
        const marks = [];
        const lineSpacing = fieldScale.width / 12;
        const topHashY = fieldScale.height * 0.3;
        const bottomHashY = fieldScale.height * 0.7;
        
        for (let i = 0; i < 13; i++) {
            const x = i * lineSpacing;
            marks.push(
                <g key={`hash-${i}`}>
                    <line x1={x} y1={topHashY - 10} x2={x} y2={topHashY + 10} className="hash-mark" />
                    <line x1={x} y1={bottomHashY - 10} x2={x} y2={bottomHashY + 10} className="hash-mark" />
                </g>
            );
        }
        return marks;
    }, [fieldScale]);

    // Generate field numbers
    const generateFieldNumbers = useCallback(() => {
        const numbers = [];
        const lineSpacing = fieldScale.width / 12;
        const yardNumbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];
        
        yardNumbers.forEach((number, index) => {
            const x = (index + 2) * lineSpacing;
            numbers.push(
                <text
                    key={`number-${index}`}
                    x={x}
                    y={fieldScale.height / 2 + 5}
                    className="field-numbers"
                >
                    {number}
                </text>
            );
        });
        
        return numbers;
    }, [fieldScale]);

    // Get marker color based on detection type and team
    const getMarkerColor = useCallback((detection, mappedPlayer) => {
        if (detection.class === 'ref') return '#fbbf24'; // Yellow for refs
        
        if (mappedPlayer) {
            return mappedPlayer.team === 'offense' ? '#10b981' : '#ef4444'; // Green for offense, red for defense
        }
        
        return '#3b82f6'; // Default blue for players
    }, []);

    // Generate player markers
    const generateMarkers = useCallback(() => {
        if (!detections || detections.length === 0) return [];
        
        return detections.map((detection, index) => {
            const svgPos = pixelToSVG(detection.x, detection.y);
            const mappedPlayer = mappedData?.players.find(p => p.detectionId === detection.detection_id);
            const isHighlighted = highlightedIndex === index;
            const color = getMarkerColor(detection, mappedPlayer);
            
            return (
                <g
                    key={detection.detection_id}
                    className="field-marker cursor-pointer"
                    onClick={() => onMarkerClick && onMarkerClick(index)}
                >
                    <circle
                        cx={svgPos.x}
                        cy={svgPos.y}
                        r={isHighlighted ? 12 : 8}
                        fill={color}
                        stroke={isHighlighted ? "#000" : "#fff"}
                        strokeWidth={isHighlighted ? 3 : 2}
                        opacity={detection.confidence >= 0.7 ? 0.9 : 0.6}
                    />
                    <text
                        x={svgPos.x}
                        y={svgPos.y + 4}
                        textAnchor="middle"
                        className="text-xs font-bold fill-white pointer-events-none"
                    >
                        {detection.class === 'ref' ? 'R' : 
                         mappedPlayer?.team === 'offense' ? 'O' : 
                         mappedPlayer?.team === 'defense' ? 'D' : 'P'}
                    </text>
                </g>
            );
        });
    }, [detections, mappedData, highlightedIndex, pixelToSVG, getMarkerColor, onMarkerClick]);

    // Generate line of scrimmage
    const generateLineOfScrimmage = useCallback(() => {
        if (!lineOfScrimmage || !fieldDimensions) return null;
        
        const svgPos = pixelToSVG(lineOfScrimmage, fieldScale.height / 2);
        
        return (
            <line
                x1={svgPos.x}
                y1={0}
                x2={svgPos.x}
                y2={fieldScale.height}
                stroke="#fbbf24"
                strokeWidth="4"
                opacity="0.8"
                strokeDasharray="5,5"
            />
        );
    }, [lineOfScrimmage, fieldDimensions, pixelToSVG, fieldScale]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🏟️ Field Visualization</h2>
            
            <div className="flex justify-center">
                <div className="relative bg-field-green rounded-lg p-4" style={{ width: fieldScale.width, height: fieldScale.height }}>
                    <svg width="100%" height="100%" className="border-2 border-white">
                        {/* Field background */}
                        <rect width="100%" height="100%" fill="#2d5a27" />
                        
                        {/* End zones */}
                        <rect x="0" y="0" width="83.33" height="100%" className="end-zone" />
                        <rect x="916.67" y="0" width="83.33" height="100%" className="end-zone" />
                        
                        {/* Yard lines */}
                        <g>{generateYardLines()}</g>
                        
                        {/* Hash marks */}
                        <g>{generateHashMarks()}</g>
                        
                        {/* Field numbers */}
                        <g>{generateFieldNumbers()}</g>
                        
                        {/* Line of scrimmage */}
                        {generateLineOfScrimmage()}
                        
                        {/* Detection markers */}
                        <g>{generateMarkers()}</g>
                    </svg>
                </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex justify-center">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Legend</h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span>Offense</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                            <span>Defense</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                            <span>Unclassified Players</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                            <span>Referees</span>
                        </div>
                        {lineOfScrimmage && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-1 bg-yellow-500" style={{ borderStyle: 'dashed' }}></div>
                                <span>Line of Scrimmage</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-400 rounded-full opacity-60"></div>
                            <span>Low Confidence (&lt;70%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FieldVisualization; 