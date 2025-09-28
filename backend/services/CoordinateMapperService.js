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
   * Calculates the Euclidean distance between two players.
   * @param {object} playerA - The first player object.
   * @param {object} playerB - The second player object.
   * @returns {number} The distance between the two players in yards.
   */
  calculateDistance(playerA, playerB) {
      const dx = playerA.coordinates.x_yards - playerB.coordinates.x_yards;
      const dy = playerA.coordinates.y_yards - playerB.coordinates.y_yards;
      return Math.sqrt(dx**2 + dy**2);
  }

  /**
   * Classifies defensive coverage into specific play types based on player alignments.
   * This function matches receivers to the closest aligned DBs to identify man coverage signals.
   * Remaining DBs are then classified as zone players or deep safeties.
   * @param {object} playData - The raw play data object containing a list of players.
   * @returns {object} An object containing the coverage call and detailed analysis metrics.
   */
  classifyCoverageV2(playData) {
      // --- Thresholds (in yards) ---
      const DEEP_SAFETY_MIN = 7;    // Distance from LOS considered "deep safety"
      const DEEP_CORNER_MIN = 5;    // Kept for potential backward compatibility
      const PRESS_YARDS = 3;        // Distance for press coverage classification
      const MAN_MATCH_YARDS = 12;   // Safety distance threshold for matching
      const SHALLOW_FLAT_YARDS = 4.0;
      const ALIGNMENT_Y_DIFF = 1;   // Max y-difference to consider a DB aligned with a receiver

      // --- Player Filtering ---
      const defense = playData.players?.filter(p => p.team === "defense") || [];
      const offense = playData.players?.filter(p => p.team === "offense") || [];

      const dbs = defense.filter(p => ["DB", "CB", "S", "FS", "SS"].includes(p.position));
      const lbs = defense.filter(p => ["LB", "MLB", "OLB"].includes(p.position));
      const receivers = offense.filter(p => ["WR", "TE"].includes(p.position));

      // --- Core Analysis ---
      const deepSafeties = [];
      let manSignals = 0;
      let zoneSignals = 0;
      const pressCorners = 0; // Note: Original python code initialized but never used these.
      const shallowCorners = 0; // They are included here to match the output structure.

      // Work on a mutable list of available DBs
      let availableDbs = [...dbs];

      // For each receiver, find the closest aligned DB.
      // If a match is found, count it as a man signal and remove the DB from the available pool.
      for (const receiver of receivers) {
          // Find aligned DB candidates among the remaining DBs
          const candidates = availableDbs.filter(db =>
              Math.abs(db.coordinates.y_yards - receiver.coordinates.y_yards) <= ALIGNMENT_Y_DIFF &&
              Math.abs(db.coordinates.x_yards) <= 7
          );

          if (candidates.length === 0) {
              continue; // No aligned DBs for this receiver
          }

          // Pick the candidate DB with the minimum euclidean distance to the receiver
          const closestDb = candidates.reduce((prev, curr) =>
              calculateDistance(curr, receiver) < calculateDistance(prev, receiver) ? curr : prev
          );

          // Count as a man coverage signal and remove the matched DB
          manSignals++;
          const dbIndex = availableDbs.findIndex(db => db === closestDb);
          if (dbIndex > -1) {
              availableDbs.splice(dbIndex, 1);
          }   
      }

      for (const db of availableDbs) {
          const distFromLos = Math.abs(db.coordinates.x_yards);
          if (distFromLos <= DEEP_SAFETY_MIN) {
              zoneSignals++;
          } else {
              deepSafeties.push(db);
          }
      }

      const numDeepSafeties = deepSafeties.length;
      console.log(numDeepSafeties);

      const lbDepths = lbs.map(lb => lb.coordinates?.x_yards).filter(d => d !== undefined);
      const avgLbDepth = lbDepths.length > 0 ? Math.abs(lbDepths.reduce((sum, depth) => sum + depth, 0) / lbDepths.length) : 0;

      // --- Coverage Classification ---
      let coverage = "Unknown";

      if (numDeepSafeties === 0) {
          coverage = "Cover 0 Man";
      } else if (numDeepSafeties === 1) {
          coverage = (manSignals >= zoneSignals) ? "Cover 1 (Man Free)" : "Cover 3 Zone";
      } else if (numDeepSafeties === 2) {
          if (manSignals >= zoneSignals) {
              coverage = "Cover 2 Man";
          } else if (zoneSignals <= 2) {
              coverage = "Cover 2 Zone";
          } else {
              coverage = "Cover 4 Zone";
          }
      } else if (numDeepSafeties === 3) {
          coverage = (manSignals >= zoneSignals) ? "Cover 3 Man" : "Cover 4 Zone";
      } else if (numDeepSafeties >= 4) {
          coverage = "Prevent";
      }

      const coverageAnalysis = {
          coverage_call: coverage,
          analysis: {
              deep_safeties: numDeepSafeties,
              deep_corners: dbs.filter(c => Math.abs(c.coordinates.x_yards) >= DEEP_CORNER_MIN).length,
              man_signals: manSignals,
              zone_signals: zoneSignals,
              press_corners: pressCorners,
              shallow_corners: shallowCorners,
              avg_lb_depth: parseFloat(avgLbDepth.toFixed(2))
          }
      };

      // Save to output.json in the current directory
      const outputPath = path.join(__dirname, 'output.json');
      fs.writeFileSync(outputPath, JSON.stringify(coverageAnalysis, null, 2));

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