/**
 * MapCoordinates.js
 * JavaScript implementation of football player coordinate mapping
 * Converts pixel coordinates to field-relative coordinates in yards
 */

class MapCoordinates {
    constructor() {
        this.nflFieldWidthYards = 53.3;
    }

    /**
     * Classify players as offense or defense based on their position relative to the line of scrimmage
     */
    classifyOffenseDefense(players, lineOfScrimmageX) {
        const offense = [];
        const defense = [];
        
        for (const player of players) {
            if (player.class !== 'player') {
                continue;
            }
            
            const x = player.x;
            
            // Players to the left of line of scrimmage vs right
            // You may need to flip this depending on which direction your team is going
            if (x < lineOfScrimmageX) {
                offense.push(player);
            } else {
                defense.push(player);
            }
        }
        
        return { offense, defense };
    }

    /**
     * Estimate line of scrimmage to create roughly balanced teams (around 11 players each)
     */
    estimateLineOfScrimmage(players) {
        const playerList = players.filter(p => p.class === 'player');
        if (playerList.length < 4) {
            return null;
        }
        
        const xPositions = playerList.map(p => p.x);
        const xSorted = [...xPositions].sort((a, b) => a - b);
        
        // Method 1: Find position that creates most balanced split
        let bestLine = null;
        let bestBalanceScore = Infinity;
        
        // Try different potential line positions
        for (let i = 0; i < xSorted.length - 1; i++) {
            const potentialLine = (xSorted[i] + xSorted[i + 1]) / 2;
            
            // Count players on each side
            const leftCount = xPositions.filter(x => x < potentialLine).length;
            const rightCount = xPositions.filter(x => x >= potentialLine).length;
            
            // Score based on how close to 50/50 split (ideal for football)
            const balanceScore = Math.abs(leftCount - rightCount);
            
            // Prefer splits that are closer to even
            if (balanceScore < bestBalanceScore) {
                bestBalanceScore = balanceScore;
                bestLine = potentialLine;
            }
        }
        
        // Method 2: If no good balanced split found, try median approach
        if (bestLine === null || bestBalanceScore > 6) {
            // Try positions around the median
            const medianX = this.median(xPositions);
            
            // Test a few positions around median
            const testPositions = [
                medianX - 50, medianX - 25, medianX, 
                medianX + 25, medianX + 50
            ];
            
            for (const testLine of testPositions) {
                const leftCount = xPositions.filter(x => x < testLine).length;
                const rightCount = xPositions.filter(x => x >= testLine).length;
                const balanceScore = Math.abs(leftCount - rightCount);
                
                if (balanceScore < bestBalanceScore) {
                    bestBalanceScore = balanceScore;
                    bestLine = testLine;
                }
            }
        }
        
        // Method 3: Last resort - use the position that gives closest to 50/50 split
        if (bestLine === null) {
            const targetLeft = Math.floor(playerList.length / 2);
            bestLine = targetLeft < xSorted.length ? xSorted[targetLeft] : this.median(xPositions);
        }
        
        return bestLine;
    }

    /**
     * Calculate field dimensions and yard scaling using football-specific measurements
     */
    calculateFieldDimensions(allDetections, lineOfScrimmageX, players) {
        const xPositions = allDetections.map(d => d.x);
        const yPositions = allDetections.map(d => d.y);
        
        const fieldWidthPixels = Math.max(...xPositions) - Math.min(...xPositions);
        const fieldLengthPixels = Math.max(...yPositions) - Math.min(...yPositions);
        
        // Use offensive backfield depth to calculate accurate scale
        let pixelsPerYard = null;
        
        if (lineOfScrimmageX && players && players.length > 0) {
            // Get offensive players (assume they're on one side of LOS)
            const { offense, defense } = this.classifyOffenseDefense(players, lineOfScrimmageX);
            
            if (offense.length >= 3) {  // Need enough players to get a good measurement
                // Find the offensive player closest to LOS and furthest from LOS
                const offenseXPositions = offense.map(p => p.x);
                const offenseMeanX = this.mean(offenseXPositions);
                
                let closestToLos, furthestFromLos;
                if (lineOfScrimmageX > offenseMeanX) {
                    // Offense is to the left of LOS
                    closestToLos = Math.max(...offenseXPositions);  // Rightmost offensive player
                    furthestFromLos = Math.min(...offenseXPositions);  // Leftmost offensive player
                } else {
                    // Offense is to the right of LOS
                    closestToLos = Math.min(...offenseXPositions);  // Leftmost offensive player
                    furthestFromLos = Math.max(...offenseXPositions);  // Rightmost offensive player
                }
                
                // Calculate backfield depth in pixels
                const backfieldDepthPixels = Math.abs(furthestFromLos - closestToLos);
                
                // Typical range is 0-5 yards
                // Use 5 yards as maximum, but could be less if formation is tighter (e.g. 3 yards)  
                const estimatedBackfieldDepthYards = Math.min(5, Math.max(3, backfieldDepthPixels / 40));
                
                pixelsPerYard = backfieldDepthPixels / estimatedBackfieldDepthYards;
                
                console.log(`Debug: Backfield depth = ${backfieldDepthPixels.toFixed(1)} pixels = ${estimatedBackfieldDepthYards} yards`);
                console.log(`Debug: Calculated scale = ${pixelsPerYard.toFixed(1)} pixels per yard`);
            }
        }
        
        // Fallback method if we can't use backfield measurement
        if (pixelsPerYard === null) {
            // Use width estimation as fallback
            const estimatedWidthYards = Math.min(40, Math.max(25, fieldWidthPixels / 20));
            pixelsPerYard = fieldWidthPixels / estimatedWidthYards;
        }
        
        // Calculate dimensions using actual NFL field width (53.3 yards)
        const nflFieldWidthPixels = this.nflFieldWidthYards * pixelsPerYard;
        
        // Find the center of all detected players/refs in y-direction
        const fieldCenterY = (Math.min(...yPositions) + Math.max(...yPositions)) / 2;
        
        // Calculate proper sideline positions based on NFL field width
        const sidelineTop = fieldCenterY - (nflFieldWidthPixels / 2);
        const sidelineBottom = fieldCenterY + (nflFieldWidthPixels / 2);
        
        // Keep original detection bounds for reference
        const detectedWidthYards = fieldWidthPixels / pixelsPerYard;
        const estimatedLengthYards = fieldLengthPixels / pixelsPerYard;
        
        return {
            widthPixels: nflFieldWidthPixels,  // Use actual NFL width
            lengthPixels: fieldLengthPixels,
            widthYards: this.nflFieldWidthYards,    // Use actual NFL width (53.3 yards)
            lengthYards: estimatedLengthYards,
            pixelsPerYard: pixelsPerYard,
            xMin: Math.min(...xPositions),
            xMax: Math.max(...xPositions),
            yMin: sidelineTop,      // Proper top sideline position
            yMax: sidelineBottom,   // Proper bottom sideline position
            detectedYMin: Math.min(...yPositions),  // Original detection bounds for reference
            detectedYMax: Math.max(...yPositions),
            detectedWidthYards: detectedWidthYards,  // Original detected width for comparison
            fieldCenterY: fieldCenterY,
            backfieldMeasurementUsed: pixelsPerYard !== null
        };
    }

    /**
     * Map pixel coordinates to field-relative coordinates in yards
     * 
     * Coordinate system:
     * - X-axis: Line of scrimmage is at x=0, positive values are in one direction, negative in the other
     * - Y-axis: Field center is at y=0, positive values toward one sideline, negative toward the other
     * - All coordinates are in yards
     */
    mapCoordinates(detectionData, lineOfScrimmageX, fieldDims) {
        const mappedData = {
            metadata: {
                coordinateSystem: {
                    xAxis: "Line of scrimmage at x=0, offensive direction is positive",
                    yAxis: "Field center at y=0, sidelines at ±26.65 yards",
                    units: "yards"
                },
                fieldDimensions: {
                    widthYards: fieldDims.widthYards,
                    lengthYards: fieldDims.lengthYards,
                    pixelsPerYard: fieldDims.pixelsPerYard
                },
                lineOfScrimmagePixel: lineOfScrimmageX,
                fieldCenterYPixel: fieldDims.fieldCenterY
            },
            players: [],
            referees: []
        };
        
        const pixelsPerYard = fieldDims.pixelsPerYard;
        const fieldCenterY = fieldDims.fieldCenterY;
        
        // Process all detections
        const allDetections = detectionData.predictions;
        const players = allDetections.filter(d => d.class === 'player');
        
        // Classify offense and defense
        const { offense, defense } = this.classifyOffenseDefense(players, lineOfScrimmageX);
        
        // Map player coordinates
        for (const detection of allDetections) {
            if (detection.class === 'player') {
                // Convert pixel coordinates to yard coordinates relative to line of scrimmage and field center
                const xYards = (detection.x - lineOfScrimmageX) / pixelsPerYard;
                const yYards = (detection.y - fieldCenterY) / pixelsPerYard;
                
                // Determine team
                const team = offense.includes(detection) ? "offense" : "defense";
                
                const playerData = {
                    detectionId: detection.detection_id,
                    team: team,
                    coordinates: {
                        xYards: Math.round(xYards * 100) / 100,  // Distance from line of scrimmage
                        yYards: Math.round(yYards * 100) / 100,  // Distance from field center
                        originalPixelX: detection.x,
                        originalPixelY: detection.y
                    },
                    confidence: detection.confidence,
                    boundingBox: {
                        widthPixels: detection.width,
                        heightPixels: detection.height,
                        widthYards: Math.round((detection.width / pixelsPerYard) * 100) / 100,
                        heightYards: Math.round((detection.height / pixelsPerYard) * 100) / 100
                    }
                };
                mappedData.players.push(playerData);
            }
            
            else if (detection.class === 'ref') {
                // Convert referee coordinates
                const xYards = (detection.x - lineOfScrimmageX) / pixelsPerYard;
                const yYards = (detection.y - fieldCenterY) / pixelsPerYard;
                
                const refereeData = {
                    detectionId: detection.detection_id,
                    coordinates: {
                        xYards: Math.round(xYards * 100) / 100,
                        yYards: Math.round(yYards * 100) / 100,
                        originalPixelX: detection.x,
                        originalPixelY: detection.y
                    },
                    confidence: detection.confidence,
                    boundingBox: {
                        widthPixels: detection.width,
                        heightPixels: detection.height,
                        widthYards: Math.round((detection.width / pixelsPerYard) * 100) / 100,
                        heightYards: Math.round((detection.height / pixelsPerYard) * 100) / 100
                    }
                };
                mappedData.referees.push(refereeData);
            }
        }
        
        // Add team statistics
        mappedData.teamStats = {
            totalPlayers: mappedData.players.length,
            offenseCount: offense.length,
            defenseCount: defense.length,
            refereeCount: mappedData.referees.length,
            teamBalance: Math.abs(offense.length - defense.length) <= 3 ? "balanced" : "unbalanced"
        };
        
        console.log(`\n=== Coordinate Mapping Complete ===`);
        console.log(`Mapped ${mappedData.players.length} players and ${mappedData.referees.length} referees`);
        console.log(`Coordinate system: Line of scrimmage at x=0, field center at y=0`);
        console.log(`Scale: ${pixelsPerYard.toFixed(1)} pixels per yard`);
        
        return mappedData;
    }

    /**
     * Process detection data and return mapped coordinates
     * Main entry point for coordinate mapping
     */
    processDetections(detectionData) {
        // Extract all players
        const allDetections = detectionData.predictions;
        const players = allDetections.filter(d => d.class === 'player');
        
        // Calculate line of scrimmage and field dimensions
        const lineOfScrimmageX = this.estimateLineOfScrimmage(players);
        const fieldDims = this.calculateFieldDimensions(allDetections, lineOfScrimmageX, players);
        
        // Map coordinates
        const mappedData = this.mapCoordinates(detectionData, lineOfScrimmageX, fieldDims);
        
        return {
            mappedData,
            lineOfScrimmageX,
            fieldDims
        };
    }

    /**
     * Export mapped data to JSON file (Node.js environment)
     */
    exportToFile(mappedData, filename = 'output.json') {
        if (typeof require !== 'undefined') {
            // Node.js environment
            const fs = require('fs');
            fs.writeFileSync(filename, JSON.stringify(mappedData, null, 2));
            console.log(`Exported to: ${filename}`);
        } else {
            // Browser environment - return JSON string for download or processing
            console.log('Browser environment detected. Use downloadJSON() method or process the returned JSON string.');
            return JSON.stringify(mappedData, null, 2);
        }
    }

    /**
     * Download JSON file in browser environment
     */
    downloadJSON(mappedData, filename = 'output.json') {
        const jsonString = JSON.stringify(mappedData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Utility methods
    mean(arr) {
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    median(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapCoordinates;
} else if (typeof window !== 'undefined') {
    window.MapCoordinates = MapCoordinates;
}

// ES6 module export for modern environments
export { MapCoordinates };

// Example usage:
// const mapper = new MapCoordinates();
// const result = mapper.processDetections(detectionData);
// mapper.exportToFile(result.mappedData, 'football_coordinates.json'); 