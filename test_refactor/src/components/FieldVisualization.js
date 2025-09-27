import React, { useMemo, useCallback, useState } from 'react';

const FieldVisualization = ({ 
    detections, 
    mappedData, 
    lineOfScrimmage, 
    fieldDimensions,
    highlightedIndex,
    onMarkerClick 
}) => {
    // Calculate field scaling using offensive backfield measurement approach from Python script
    const fieldScale = useMemo(() => {
        if (!detections || detections.length === 0) {
            return { width: 800, height: 500, pixelsPerYard: 20, lineOfScrimmage: null };
        }

        const players = detections.filter(d => d.class === 'player');
        if (players.length < 4) {
            return { width: 800, height: 500, pixelsPerYard: 20, lineOfScrimmage: null };
        }

        // Estimate line of scrimmage using the same approach as Python script
        const estimateLineOfScrimmage = (players) => {
            const xPositions = players.map(p => p.x);
            const xSorted = [...xPositions].sort((a, b) => a - b);
            
            let bestLine = null;
            let bestBalanceScore = Infinity;
            
            // Try different potential line positions for balanced split
            for (let i = 0; i < xSorted.length - 1; i++) {
                const potentialLine = (xSorted[i] + xSorted[i + 1]) / 2;
                const leftCount = xPositions.filter(x => x < potentialLine).length;
                const rightCount = xPositions.filter(x => x >= potentialLine).length;
                const balanceScore = Math.abs(leftCount - rightCount);
                
                if (balanceScore < bestBalanceScore) {
                    bestBalanceScore = balanceScore;
                    bestLine = potentialLine;
                }
            }
            
            return bestLine;
        };

        // Classify offense and defense based on line of scrimmage
        const classifyOffenseDefense = (players, lineOfScrimmageX) => {
            const offense = [];
            const defense = [];
            
            players.forEach(player => {
                if (player.x < lineOfScrimmageX) {
                    offense.push(player);
                } else {
                    defense.push(player);
                }
            });
            
            return { offense, defense };
        };

        const lineOfScrimmageX = estimateLineOfScrimmage(players);
        const { offense, defense } = classifyOffenseDefense(players, lineOfScrimmageX);
        
        // Calculate pixels per yard using offensive backfield depth (like Python script)
        let pixelsPerYard = 20; // fallback value
        
        if (offense.length >= 3) {
            const offenseXPositions = offense.map(p => p.x);
            const closestToLos = lineOfScrimmageX > offenseXPositions.reduce((sum, x) => sum + x, 0) / offenseXPositions.length
                ? Math.max(...offenseXPositions)  // Offense is to the left
                : Math.min(...offenseXPositions); // Offense is to the right
            const furthestFromLos = lineOfScrimmageX > offenseXPositions.reduce((sum, x) => sum + x, 0) / offenseXPositions.length
                ? Math.min(...offenseXPositions)  // Offense is to the left
                : Math.max(...offenseXPositions); // Offense is to the right
            
            const backfieldDepthPixels = Math.abs(furthestFromLos - closestToLos);
            
            // Estimate backfield depth in yards (typically 3-6 yards based on formation)
            // Use more accurate estimation: if backfield is very spread out, likely deeper formation
            const estimatedBackfieldDepthYards = backfieldDepthPixels > 120 ? 6 : 
                                                 backfieldDepthPixels > 80 ? 5 :
                                                 backfieldDepthPixels > 50 ? 4 : 3;
            pixelsPerYard = backfieldDepthPixels / estimatedBackfieldDepthYards;
        }
        
        // Use mapped data scaling if available and seems reasonable
        if (mappedData?.metadata?.field_dimensions?.pixels_per_yard) {
            const mappedPixelsPerYard = mappedData.metadata.field_dimensions.pixels_per_yard;
            if (mappedPixelsPerYard > 10 && mappedPixelsPerYard < 100) { // sanity check
                pixelsPerYard = mappedPixelsPerYard;
            }
        }
        
        // Calculate visualization dimensions based on actual player spread (like Python script)
        const xPositions = players.map(p => p.x);
        const yPositions = players.map(p => p.y);
        
        const fieldCenterX = (Math.max(...xPositions) + Math.min(...xPositions)) / 2;
        const fieldCenterY = (Math.max(...yPositions) + Math.min(...yPositions)) / 2;
        
        // Calculate player spread in yards
        const playerSpreadX = (Math.max(...xPositions) - Math.min(...xPositions)) / pixelsPerYard;
        const playerSpreadY = (Math.max(...yPositions) - Math.min(...yPositions)) / pixelsPerYard;
        
        // Add minimal padding for width, no padding for height (sidelines are at edges)
        const paddingXYards = 3; // Small padding for width to see players near line of scrimmage
        const paddingYYards = 0.5; // Minimal padding for height
        const visualizationWidthYards = playerSpreadX + (paddingXYards * 2);
        const visualizationHeightYards = playerSpreadY + (paddingYYards * 2);
        
        // Scale for display - make it much larger and maintain accurate yardage
        const maxWidthPixels = 1000; // Increased from 600
        const maxHeightPixels = 700;  // Increased from 400
        const maxPixelsPerYard = 40;  // Increased from 20 for better detail
        
        const displayScale = Math.min(maxWidthPixels / visualizationWidthYards, maxHeightPixels / visualizationHeightYards, maxPixelsPerYard);
        const displayWidth = visualizationWidthYards * displayScale;
        const displayHeight = visualizationHeightYards * displayScale;
        
        // Set sidelines to visualization edges with minimal padding
        const sidelineTop = Math.min(...yPositions) - (paddingYYards * pixelsPerYard);
        const sidelineBottom = Math.max(...yPositions) + (paddingYYards * pixelsPerYard);
        
        return { 
            width: displayWidth, 
            height: displayHeight, 
            pixelsPerYard,
            lineOfScrimmage: lineOfScrimmageX,
            offense,
            defense,
            fieldCenterX,
            fieldCenterY,
            sidelineTop,
            sidelineBottom,
            displayScale,
            visualizationWidthYards,
            visualizationHeightYards,
            // Debug info for scale verification
            backfieldDepthPixels: offense.length >= 3 ? Math.abs(Math.max(...offense.map(p => p.x)) - Math.min(...offense.map(p => p.x))) : null,
            estimatedBackfieldYards: offense.length >= 3 ? Math.abs(Math.max(...offense.map(p => p.x)) - Math.min(...offense.map(p => p.x))) / pixelsPerYard : null
        };
    }, [detections, mappedData]);

    // Convert pixel coordinates to SVG coordinates using proper yard-based scaling
    const pixelToSVG = useCallback((x, y) => {
        if (!detections || detections.length === 0 || !fieldScale.fieldCenterX) {
            return { x: fieldScale.width / 2, y: fieldScale.height / 2 };
        }

        // Convert pixel coordinates to yards relative to field center
        const xYards = (x - fieldScale.fieldCenterX) / fieldScale.pixelsPerYard;
        const yYards = (y - fieldScale.fieldCenterY) / fieldScale.pixelsPerYard;
        
        // Convert yards to SVG coordinates - center the visualization on the field center
        const svgX = fieldScale.width / 2 + (xYards * fieldScale.displayScale);
        const svgY = fieldScale.height / 2 + (yYards * fieldScale.displayScale);
        
        return { x: svgX, y: svgY };
    }, [fieldScale, detections]);

    // Generate yard lines based on actual yardage
    const generateYardLines = useCallback(() => {
        if (!fieldScale.lineOfScrimmage || !fieldScale.pixelsPerYard) return [];
        
        const lines = [];
        const players = detections?.filter(d => d.class === 'player') || [];
        if (players.length === 0) return [];
        
        // Calculate yard positions relative to line of scrimmage
        const xPositions = players.map(p => p.x);
        const minX = Math.min(...xPositions);
        const maxX = Math.max(...xPositions);
        
        // Convert to yards from line of scrimmage
        const minYards = Math.floor((minX - fieldScale.lineOfScrimmage) / fieldScale.pixelsPerYard / 5) * 5;
        const maxYards = Math.ceil((maxX - fieldScale.lineOfScrimmage) / fieldScale.pixelsPerYard / 5) * 5;
        
        // Generate yard lines every 5 yards
        for (let yards = minYards; yards <= maxYards; yards += 5) {
            const pixelX = fieldScale.lineOfScrimmage + (yards * fieldScale.pixelsPerYard);
            const svgPos = pixelToSVG(pixelX, fieldScale.fieldCenterY);
            
            // Only show if within visible area and not the line of scrimmage
            if (svgPos.x >= 0 && svgPos.x <= fieldScale.width && yards !== 0) {
                lines.push(
                    <line
                        key={`yard-line-${yards}`}
                        x1={svgPos.x}
                        y1={0}
                        x2={svgPos.x}
                        y2={fieldScale.height}
                        stroke="white"
                        strokeWidth="1"
                        opacity="0.3"
                    />
                );
            }
        }
        return lines;
    }, [fieldScale, detections, pixelToSVG]);

    // Generate hash marks based on actual yardage
    const generateHashMarks = useCallback(() => {
        if (!fieldScale.lineOfScrimmage || !fieldScale.pixelsPerYard) return [];
        
        const marks = [];
        const players = detections?.filter(d => d.class === 'player') || [];
        if (players.length === 0) return [];
        
        // Calculate hash mark positions at 1/3 and 2/3 of field height
        const topHashY = fieldScale.height * 0.3;
        const bottomHashY = fieldScale.height * 0.7;
        
        // Calculate yard positions relative to line of scrimmage
        const xPositions = players.map(p => p.x);
        const minX = Math.min(...xPositions);
        const maxX = Math.max(...xPositions);
        
        // Convert to yards from line of scrimmage
        const minYards = Math.floor((minX - fieldScale.lineOfScrimmage) / fieldScale.pixelsPerYard / 5) * 5;
        const maxYards = Math.ceil((maxX - fieldScale.lineOfScrimmage) / fieldScale.pixelsPerYard / 5) * 5;
        
        // Generate hash marks every 5 yards
        for (let yards = minYards; yards <= maxYards; yards += 5) {
            const pixelX = fieldScale.lineOfScrimmage + (yards * fieldScale.pixelsPerYard);
            const svgPos = pixelToSVG(pixelX, fieldScale.fieldCenterY);
            
            // Only show if within visible area
            if (svgPos.x >= 0 && svgPos.x <= fieldScale.width) {
                marks.push(
                    <g key={`hash-${yards}`}>
                        <line x1={svgPos.x} y1={topHashY - 8} x2={svgPos.x} y2={topHashY + 8} stroke="white" strokeWidth="2" opacity="0.4" />
                        <line x1={svgPos.x} y1={bottomHashY - 8} x2={svgPos.x} y2={bottomHashY + 8} stroke="white" strokeWidth="2" opacity="0.4" />
                    </g>
                );
            }
        }
        return marks;
    }, [fieldScale, detections, pixelToSVG]);


    // Generate sidelines at the very edges of the visualization
    const generateSidelines = useCallback(() => {
        if (!fieldScale.fieldCenterY || !detections || detections.length === 0) return null;
        
        return (
            <g key="sidelines">
                {/* Top sideline (at top edge) */}
                <line
                    x1="0"
                    y1="0"
                    x2={fieldScale.width}
                    y2="0"
                    stroke="white"
                    strokeWidth="3"
                    opacity="0.8"
                />
                {/* Bottom sideline (at bottom edge) */}
                <line
                    x1="0"
                    y1={fieldScale.height}
                    x2={fieldScale.width}
                    y2={fieldScale.height}
                    stroke="white"
                    strokeWidth="3"
                    opacity="0.8"
                />
            </g>
        );
    }, [fieldScale, detections]);

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
        // Use the calculated line of scrimmage from fieldScale, or fall back to prop
        const losX = fieldScale.lineOfScrimmage || lineOfScrimmage;
        if (!losX || !fieldScale.fieldCenterY) return null;
        
        // Convert line of scrimmage position to SVG coordinates
        const svgPos = pixelToSVG(losX, fieldScale.fieldCenterY);
        
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
    }, [lineOfScrimmage, fieldScale, pixelToSVG]);

    // Generate mapped coordinates data (similar to Python script)
    const generateMappedData = useCallback(() => {
        if (!detections || detections.length === 0 || !fieldScale.lineOfScrimmage || !fieldScale.pixelsPerYard) {
            return null;
        }

        const mappedData = {
            metadata: {
                coordinate_system: {
                    x_axis: "Line of scrimmage at x=0, offensive direction is positive",
                    y_axis: "Field center at y=0, sidelines at boundaries", 
                    units: "yards"
                },
                field_dimensions: {
                    width_yards: fieldScale.visualizationWidthYards,
                    height_yards: fieldScale.visualizationHeightYards,
                    pixels_per_yard: fieldScale.pixelsPerYard,
                    display_scale: fieldScale.displayScale
                },
                line_of_scrimmage_pixel: fieldScale.lineOfScrimmage,
                field_center_y_pixel: fieldScale.fieldCenterY,
                field_center_x_pixel: fieldScale.fieldCenterX,
                export_timestamp: new Date().toISOString()
            },
            players: [],
            referees: []
        };

        // Process all detections
        detections.forEach(detection => {
            // Convert pixel coordinates to yard coordinates relative to field centers
            const xYards = (detection.x - fieldScale.fieldCenterX) / fieldScale.pixelsPerYard;
            const yYards = (detection.y - fieldScale.fieldCenterY) / fieldScale.pixelsPerYard;
            
            // Distance from line of scrimmage
            const xFromLOS = (detection.x - fieldScale.lineOfScrimmage) / fieldScale.pixelsPerYard;

            if (detection.class === 'player') {
                // Determine team based on field calculation
                const isOffense = fieldScale.offense?.some(p => p.detection_id === detection.detection_id);
                const isDefense = fieldScale.defense?.some(p => p.detection_id === detection.detection_id);
                const team = isOffense ? "offense" : isDefense ? "defense" : "unclassified";
                
                const playerData = {
                    detection_id: detection.detection_id,
                    team: team,
                    coordinates: {
                        x_yards: Math.round(xYards * 100) / 100,  // Distance from field center X
                        y_yards: Math.round(yYards * 100) / 100,  // Distance from field center Y
                        x_from_los_yards: Math.round(xFromLOS * 100) / 100, // Distance from line of scrimmage
                        original_pixel_x: detection.x,
                        original_pixel_y: detection.y
                    },
                    confidence: detection.confidence,
                    bounding_box: {
                        width_pixels: detection.width,
                        height_pixels: detection.height,
                        width_yards: Math.round((detection.width / fieldScale.pixelsPerYard) * 100) / 100,
                        height_yards: Math.round((detection.height / fieldScale.pixelsPerYard) * 100) / 100
                    }
                };
                mappedData.players.push(playerData);
                
            } else if (detection.class === 'ref') {
                const refereeData = {
                    detection_id: detection.detection_id,
                    coordinates: {
                        x_yards: Math.round(xYards * 100) / 100,
                        y_yards: Math.round(yYards * 100) / 100,
                        x_from_los_yards: Math.round(xFromLOS * 100) / 100,
                        original_pixel_x: detection.x,
                        original_pixel_y: detection.y
                    },
                    confidence: detection.confidence,
                    bounding_box: {
                        width_pixels: detection.width,
                        height_pixels: detection.height,
                        width_yards: Math.round((detection.width / fieldScale.pixelsPerYard) * 100) / 100,
                        height_yards: Math.round((detection.height / fieldScale.pixelsPerYard) * 100) / 100
                    }
                };
                mappedData.referees.push(refereeData);
            }
        });

        // Add team statistics
        mappedData.team_stats = {
            total_players: mappedData.players.length,
            offense_count: fieldScale.offense?.length || 0,
            defense_count: fieldScale.defense?.length || 0,
            referee_count: mappedData.referees.length,
            team_balance: Math.abs((fieldScale.offense?.length || 0) - (fieldScale.defense?.length || 0)) <= 3 ? "balanced" : "unbalanced"
        };

        return mappedData;
    }, [detections, fieldScale]);

    // Export mapped data as JSON file
    const handleExportJSON = useCallback(() => {
        const mappedData = generateMappedData();
        if (!mappedData) {
            alert("No data available to export");
            return;
        }

        const dataStr = JSON.stringify(mappedData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `field_coordinates_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [generateMappedData]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">🏟️ Field Visualization</h2>
                <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    disabled={!detections || detections.length === 0}
                >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                    </svg>
                    Export JSON
                </button>
            </div>
            
            <div className="flex justify-center">
                <div className="relative bg-field-green rounded-lg p-4 border-4 border-white shadow-xl" style={{ 
                    backgroundColor: '#1a4a1a'
                }}>
                    <svg 
                        width={fieldScale.width} 
                        height={fieldScale.height} 
                        className="border-2 border-white rounded"
                        style={{ backgroundColor: '#2d5a27' }}
                    >
                        {/* Field background */}
                        <rect width="100%" height="100%" fill="#2d5a27" />
                        
                        {/* Accurate sidelines */}
                        {generateSidelines()}
                        
                        {/* Yard lines */}
                        <g>{generateYardLines()}</g>
                        
                        {/* Hash marks */}
                        <g>{generateHashMarks()}</g>
                        
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
                    <h3 className="font-semibold text-gray-800 mb-2">Legend & Field Info</h3>
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span>Offense ({fieldScale.offense?.length || 0})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                            <span>Defense ({fieldScale.defense?.length || 0})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                            <span>Unclassified Players</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                            <span>Referees</span>
                        </div>
                        {(lineOfScrimmage || fieldScale.lineOfScrimmage) && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-1 bg-yellow-500" style={{ borderStyle: 'dashed' }}></div>
                                <span>Line of Scrimmage</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-400 rounded-full opacity-60"></div>
                            <span>Low Confidence (&lt;70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-white"></div>
                            <span>Sidelines</span>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default FieldVisualization; 