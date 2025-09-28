const fs = require('fs').promises;
const path = require('path');

/**
 * CoordinateMapperService.js
 * Node.js service for football player coordinate mapping
 * Converts pixel coordinates to field-relative coordinates in yards
 */

class CoordinateMapperService {
  constructor() {
    this.nflFieldWidthYards = 53.3;
    
    // Define offensive and defensive positions
    this.offensivePositions = ['QB', 'RB', 'FB', 'WR', 'TE', 'C', 'OG', 'OT'];
    this.defensivePositions = ['DE', 'DT', 'NT', 'LB', 'MLB', 'OLB', 'CB', 'DB', 'S', 'FS', 'SS'];
    this.specialPositions = ['K', 'P', 'LS', 'KR', 'PR'];
    
    // Ensure exports directory exists
    this.exportDir = process.env.EXPORT_DIR || path.join(__dirname, '../exports');
    this.ensureExportDir();
  }

  /**
   * Ensure export directory exists
   */
  async ensureExportDir() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      console.error('Error creating export directory:', error);
    }
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
        fieldCenterYPixel: fieldDims.fieldCenterY,
        processedAt: new Date().toISOString()
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
    
    // Perform defensive coverage analysis
    const coverageAnalysis = this.classifyCoverageV2(mappedData);
    
    return {
      mappedData,
      lineOfScrimmageX,
      fieldDims,
      coverageAnalysis
    };
  }

  /**
   * Export to JSON file (Node.js version)
   */
  async exportToJSON(mappedData, filename = 'football_coordinates.json', coverageAnalysis = null) {
    try {
      const exportData = {
        ...mappedData,
        ...(coverageAnalysis && { coverageAnalysis })
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const filePath = path.join(this.exportDir, filename);
      
      await fs.writeFile(filePath, jsonString, 'utf8');
      
      return {
        success: true,
        filePath: filePath,
        filename: filename,
        size: jsonString.length
      };
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Get available positions for validation
   */
  getAvailablePositions() {
    return {
      offensive: [...this.offensivePositions],
      defensive: [...this.defensivePositions],
      special: [...this.specialPositions]
    };
  }

  /**
   * Calculate Euclidean distance between two players
   */
  calculateDistance(playerA, playerB) {
    const dx = playerA.coordinates.xYards - playerB.coordinates.xYards;
    const dy = playerA.coordinates.yYards - playerB.coordinates.yYards;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Classifies defensive coverage into specific play types:
   * - Cover 0, Cover 1, Cover 2 (Man/Zone), Cover 3, Cover 4 (Man/Zone)
   * Accounts for both deep safeties and deep corners.
   * Adds man indicator if WR and DB are aligned within 1 yard (y_yards difference).
   * Thresholds scaled for mapping where 11 real yards = 7 mapped yards.
   */
  classifyCoverageV2(playData) {
    // --- Thresholds (mapped yards) ---
    const DEEP_SAFETY_MIN = 5;
    const DEEP_CORNER_MIN = 5;    // ~5.7 mapped yards
    const PRESS_YARDS = 3;         // ~1.3 mapped yards
    const MAN_MATCH_YARDS = 12;    // ~3.2 mapped yards
    const SHALLOW_FLAT_YARDS = 4.0;  // ~2.5 mapped yards
    const ALIGNMENT_Y_DIFF = 1.5;           // 1 yard difference in y_yards → man indicator

    // --- Player Filtering ---
    const defense = playData.players?.filter(p => p.team === "defense") || [];
    const offense = playData.players?.filter(p => p.team === "offense") || [];

    const safeties = defense.filter(p => ["S", "FS", "SS"].includes(p.position));
    const dbs = defense.filter(p => ["DB", "CB"].includes(p.position));
    const corners = defense.filter(p => p.position === "CB");
    const lbs = defense.filter(p => ["LB", "MLB", "OLB"].includes(p.position));
    const receivers = offense.filter(p => ["WR", "TE"].includes(p.position));

    // --- Core Analysis ---
    const deepSafeties = safeties.filter(s => Math.abs(s.coordinates.xYards) >= DEEP_SAFETY_MIN);
    const numDeepSafeties = deepSafeties.length;

    const deepCorners = corners.filter(c => Math.abs(c.coordinates.xYards) >= DEEP_CORNER_MIN);
    const numDeepCorners = deepCorners.length;

    let manSignals = 0;
    let zoneSignals = 0;
    let pressCorners = 0;
    let shallowCorners = 0;

    if (receivers.length > 0 && dbs.length > 0) {
      const availableReceivers = [...receivers]; // Create a mutable copy
      
      // Sort DBs by y-coordinates (left to right)
      const sortedDbs = [...dbs].sort((a, b) => a.coordinates.yYards - b.coordinates.yYards);
      
      for (const db of sortedDbs) {
        if (availableReceivers.length === 0) {
          break; // Stop if no more receivers are available to match
        }

        // Find the receiver with minimum y-distance to the current DB
        const closestReceiver = availableReceivers.reduce((closest, receiver) => {
          const currentDistance = Math.abs(receiver.coordinates.yYards - db.coordinates.yYards);
          const closestDistance = Math.abs(closest.coordinates.yYards - db.coordinates.yYards);
          return currentDistance < closestDistance ? receiver : closest;
        });

        const yDiff = Math.abs(db.coordinates.yYards - closestReceiver.coordinates.yYards);
        const distance = this.calculateDistance(db, closestReceiver);

        // Proximity indicator
        if (distance <= MAN_MATCH_YARDS && yDiff <= ALIGNMENT_Y_DIFF) {
          manSignals++;
          console.log(`MAN SIGNAL: DB (${db.position}) at (x:${db.coordinates.xYards.toFixed(1)}, y:${db.coordinates.yYards.toFixed(1)}) vs ` + 
                `Receiver (${closestReceiver.position}) at (x:${closestReceiver.coordinates.xYards.toFixed(1)}, y:${closestReceiver.coordinates.yYards.toFixed(1)})` +
                `\nY-Align: ${yDiff.toFixed(2)}, Total Dist: ${distance.toFixed(2)}\n`);
        } else {
          zoneSignals++;
          console.log(`ZONE SIGNAL: DB (${db.position}) at (x:${db.coordinates.xYards.toFixed(1)}, y:${db.coordinates.yYards.toFixed(1)}) vs ` +
                `Receiver (${closestReceiver.position}) at (x:${closestReceiver.coordinates.xYards.toFixed(1)}, y:${closestReceiver.coordinates.yYards.toFixed(1)})` +
                `\nY-Align: ${yDiff.toFixed(2)}, Total Dist: ${distance.toFixed(2)}\n`);
        }

        // Remove the matched receiver from available receivers
        const receiverIndex = availableReceivers.findIndex(r => r === closestReceiver);
        if (receiverIndex !== -1) {
          availableReceivers.splice(receiverIndex, 1);
        }
      }
    }

    const lbDepths = lbs.map(lb => lb.coordinates.xYards).filter(depth => depth !== undefined);
    const avgLbDepth = lbDepths.length > 0 ? Math.abs(lbDepths.reduce((sum, depth) => sum + depth, 0) / lbDepths.length) : 0;

    // --- Coverage Classification ---
    let coverage = "Unknown";

    if (numDeepSafeties === 0) {
      if (manSignals >= dbs.length - 1) {
        coverage = "Cover 0 (All-out Man Blitz)";
      } else {
        coverage = "Cover 0 Variant (Blitz/Robber)";
      }
    } else if (numDeepSafeties === 1) {
      if (manSignals > zoneSignals) {
        coverage = "Cover 1 (Man Free)";
      } else if (numDeepCorners >= 2) {
        coverage = "Cover 3 Zone (1 Safety + 2 Deep Corners)";
      } else {
        coverage = "Cover 3 Zone";
      }
    } else if (numDeepSafeties === 2) {
      if (manSignals > zoneSignals) {
        coverage = "Cover 2 Man";
      } else if (shallowCorners >= 2) {
        coverage = "Cover 2 Zone (Shallow Flats)";
      } else if (numDeepCorners >= 2) {
        coverage = "Cover 4 Zone (2 Safeties + 2 Corners Deep)";
      } else {
        coverage = "Cover 2 Zone";
      }
    } else if (numDeepSafeties >= 3) {
      if (manSignals > zoneSignals) {
        coverage = "Cover 4 Man (Quarters Man-Match)";
      } else {
        coverage = "Cover 4 Zone (Quarters Zone)";
      }
    }

    const coverageAnalysis = {
      coverage_call: coverage,
      analysis: {
        deep_safeties: numDeepSafeties,
        deep_corners: numDeepCorners,
        man_signals: manSignals,
        zone_signals: zoneSignals,
        press_corners: pressCorners,
        shallow_corners: shallowCorners,
        avg_lb_depth: Math.round(avgLbDepth * 100) / 100
      }
    };

    // Save to output.json in the backend directory
    const outputPath = path.join(__dirname, 'output.json');
    require('fs').writeFileSync(outputPath, JSON.stringify(coverageAnalysis, null, 2));

    return coverageAnalysis;
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

module.exports = CoordinateMapperService; 