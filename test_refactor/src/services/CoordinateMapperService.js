/**
 * CoordinateMapperService.js
 * React service for football player coordinate mapping
 * Converts pixel coordinates to field-relative coordinates in yards
 */

class CoordinateMapperService {
    constructor() {
        this.nflFieldWidthYards = 53.3;
        
        // Define offensive and defensive positions
        this.offensivePositions = ['QB', 'RB', 'FB', 'WR', 'TE', 'C', 'OG', 'OT'];
        this.defensivePositions = ['DE', 'DT', 'NT', 'LB', 'MLB', 'OLB', 'CB', 'DB', 'S', 'FS', 'SS'];
        this.specialPositions = ['K', 'P', 'LS', 'KR', 'PR'];
    }

    /**
     * Determine if a position is offensive, defensive, or special teams
     */
    getPositionType(positionClass) {
        if (this.offensivePositions.includes(positionClass)) {
            return 'offense';
        } else if (this.defensivePositions.includes(positionClass)) {
            return 'defense';
        } else if (this.specialPositions.includes(positionClass)) {
            return 'special';
        }
        return 'unknown';
    }

    /**
     * Check if a detection is a player (has a football position)
     */
    isPlayer(detection) {
        return this.offensivePositions.includes(detection.class) || 
               this.defensivePositions.includes(detection.class) ||
               this.specialPositions.includes(detection.class);
    }

    /**
     * Classify players as offense or defense based on their position relative to the line of scrimmage
     */
    classifyOffenseDefense(players, lineOfScrimmageX) {
        const offense = [];
        const defense = [];
        const special = [];
        const unknown = [];
        
        for (const player of players) {
            if (!this.isPlayer(player)) {
                continue;
            }
            
            const positionType = this.getPositionType(player.class);
            
            // First classify by position type
            if (positionType === 'offense') {
                offense.push(player);
            } else if (positionType === 'defense') {
                defense.push(player);
            } else if (positionType === 'special') {
                special.push(player);
            } else {
                // For unknown positions, fall back to line of scrimmage classification
                const x = player.x;
                if (x < lineOfScrimmageX) {
                    offense.push(player);
                } else {
                    defense.push(player);
                }
            }
        }
        
        return { offense, defense, special, unknown };
    }

    /**
     * Estimate line of scrimmage to create roughly balanced teams
     */
    estimateLineOfScrimmage(players) {
        const playerList = players.filter(p => this.isPlayer(p));
        if (playerList.length < 4) {
            return null;
        }
        
        const xPositions = playerList.map(p => p.x);
        const xSorted = [...xPositions].sort((a, b) => a - b);
        
        let bestLine = null;
        let bestBalanceScore = Infinity;
        
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
        
        // Fallback to median approach
        if (bestLine === null || bestBalanceScore > 6) {
            const medianX = this.median(xPositions);
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
        
        if (bestLine === null) {
            const targetLeft = Math.floor(playerList.length / 2);
            bestLine = targetLeft < xSorted.length ? xSorted[targetLeft] : this.median(xPositions);
        }
        
        return bestLine;
    }

    /**
     * Calculate field dimensions and yard scaling
     */
    calculateFieldDimensions(allDetections, lineOfScrimmageX, players) {
        const xPositions = allDetections.map(d => d.x);
        const yPositions = allDetections.map(d => d.y);
        
        const fieldWidthPixels = Math.max(...xPositions) - Math.min(...xPositions);
        const fieldLengthPixels = Math.max(...yPositions) - Math.min(...yPositions);
        
        let pixelsPerYard = null;
        
        if (lineOfScrimmageX && players && players.length > 0) {
            const { offense, defense } = this.classifyOffenseDefense(players, lineOfScrimmageX);
            
            if (offense.length >= 3) {
                const offenseXPositions = offense.map(p => p.x);
                const offenseMeanX = this.mean(offenseXPositions);
                
                let closestToLos, furthestFromLos;
                if (lineOfScrimmageX > offenseMeanX) {
                    closestToLos = Math.max(...offenseXPositions);
                    furthestFromLos = Math.min(...offenseXPositions);
                } else {
                    closestToLos = Math.min(...offenseXPositions);
                    furthestFromLos = Math.max(...offenseXPositions);
                }
                
                const backfieldDepthPixels = Math.abs(furthestFromLos - closestToLos);
                const estimatedBackfieldDepthYards = Math.min(5, Math.max(3, backfieldDepthPixels / 40));
                pixelsPerYard = backfieldDepthPixels / estimatedBackfieldDepthYards;
            }
        }
        
        if (pixelsPerYard === null) {
            const estimatedWidthYards = Math.min(40, Math.max(25, fieldWidthPixels / 20));
            pixelsPerYard = fieldWidthPixels / estimatedWidthYards;
        }
        
        const nflFieldWidthPixels = this.nflFieldWidthYards * pixelsPerYard;
        const fieldCenterY = (Math.min(...yPositions) + Math.max(...yPositions)) / 2;
        
        return {
            widthPixels: nflFieldWidthPixels,
            lengthPixels: fieldLengthPixels,
            widthYards: this.nflFieldWidthYards,
            lengthYards: fieldLengthPixels / pixelsPerYard,
            pixelsPerYard: pixelsPerYard,
            xMin: Math.min(...xPositions),
            xMax: Math.max(...xPositions),
            yMin: fieldCenterY - (nflFieldWidthPixels / 2),
            yMax: fieldCenterY + (nflFieldWidthPixels / 2),
            fieldCenterY: fieldCenterY,
            backfieldMeasurementUsed: pixelsPerYard !== null
        };
    }

    /**
     * Map pixel coordinates to field-relative coordinates in yards
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
        
        const allDetections = detectionData.predictions;
        const players = allDetections.filter(d => this.isPlayer(d));
        
        const { offense, defense, special } = this.classifyOffenseDefense(players, lineOfScrimmageX);
        
        for (const detection of allDetections) {
            if (this.isPlayer(detection)) {
                const xYards = (detection.x - lineOfScrimmageX) / pixelsPerYard;
                const yYards = (detection.y - fieldCenterY) / pixelsPerYard;
                
                let team = "unknown";
                if (offense.includes(detection)) {
                    team = "offense";
                } else if (defense.includes(detection)) {
                    team = "defense";
                } else if (special && special.includes(detection)) {
                    team = "special";
                }
                
                mappedData.players.push({
                    detectionId: detection.detection_id,
                    position: detection.class, // Add the specific position
                    team: team,
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
                });
            } else if (detection.class === 'ref') {
                const xYards = (detection.x - lineOfScrimmageX) / pixelsPerYard;
                const yYards = (detection.y - fieldCenterY) / pixelsPerYard;
                
                mappedData.referees.push({
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
                });
            }
        }
        
        mappedData.teamStats = {
            totalPlayers: mappedData.players.length,
            offenseCount: offense.length,
            defenseCount: defense.length,
            refereeCount: mappedData.referees.length,
            teamBalance: Math.abs(offense.length - defense.length) <= 3 ? "balanced" : "unbalanced"
        };
        
        return mappedData;
    }

    /**
     * Main processing method
     */
    processDetections(detectionData) {
        const allDetections = detectionData.predictions;
        const players = allDetections.filter(d => this.isPlayer(d));
        
        const lineOfScrimmageX = this.estimateLineOfScrimmage(players);
        const fieldDims = this.calculateFieldDimensions(allDetections, lineOfScrimmageX, players);
        const mappedData = this.mapCoordinates(detectionData, lineOfScrimmageX, fieldDims);
        
        return {
            mappedData,
            lineOfScrimmageX,
            fieldDims
        };
    }

    /**
     * Export to JSON for download
     */
    exportToJSON(mappedData, filename = 'football_coordinates.json') {
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

export default CoordinateMapperService; 