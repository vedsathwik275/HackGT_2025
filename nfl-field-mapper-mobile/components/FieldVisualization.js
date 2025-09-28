import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Svg, { Rect, Line, Circle, G, Text as SvgText } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

const FieldVisualization = ({ 
  detections, 
  mappedData, 
  lineOfScrimmage, 
  fieldDimensions,
  highlightedIndex,
  onMarkerClick 
}) => {
  // Calculate field bounds and dimensions based on player positions
  const fieldBounds = useMemo(() => {
    if (!detections || detections.length === 0) return null;
    
    // Find min/max positions from detections
    const xPositions = detections.map(d => d.x);
    const yPositions = detections.map(d => d.y);
    
    const xMin = Math.min(...xPositions);
    const xMax = Math.max(...xPositions);
    const yMin = Math.min(...yPositions);
    const yMax = Math.max(...yPositions);
    
    // Add padding (100 pixels like Python code)
    const padding = 100;
    
    return {
      xMin: xMin - padding,
      xMax: xMax + padding,
      yMin: yMin - padding,
      yMax: yMax + padding,
      dataXMin: xMin,
      dataXMax: xMax,
      dataYMin: yMin,
      dataYMax: yMax,
      width: (xMax - xMin) + (2 * padding),
      height: (yMax - yMin) + (2 * padding)
    };
  }, [detections]);

  // Calculate SVG dimensions maintaining aspect ratio
  const svgDimensions = useMemo(() => {
    if (!fieldBounds) return { width: screenWidth - 40, height: 480 };
    
    // Target dimensions (similar to Python's 10x12 figsize ratio)
    const maxWidth = screenWidth - 40; // Account for padding
    const targetAspectRatio = 10 / 12; // Width to height ratio from Python
    
    // Calculate dimensions based on actual field bounds
    const dataAspectRatio = fieldBounds.width / fieldBounds.height;
    
    let svgWidth, svgHeight;
    
    // Maintain proper aspect ratio while fitting in container
    if (dataAspectRatio > targetAspectRatio) {
      // Data is wider than target ratio
      svgWidth = maxWidth;
      svgHeight = svgWidth / dataAspectRatio;
    } else {
      // Data is taller than target ratio
      svgHeight = maxWidth / targetAspectRatio;
      svgWidth = svgHeight * dataAspectRatio;
    }
    
    // Ensure minimum dimensions
    svgWidth = Math.max(svgWidth, screenWidth - 40);
    svgHeight = Math.max(svgHeight, 400);
    
    return { width: svgWidth, height: svgHeight };
  }, [fieldBounds]);

  // Convert data coordinates to SVG coordinates
  const dataToSVG = useCallback((x, y) => {
    if (!fieldBounds) return { x: 0, y: 0 };
    
    // Map from data space to SVG space
    const svgX = ((x - fieldBounds.xMin) / fieldBounds.width) * svgDimensions.width;
    const svgY = ((y - fieldBounds.yMin) / fieldBounds.height) * svgDimensions.height;
    
    return { x: svgX, y: svgY };
  }, [fieldBounds, svgDimensions]);

  // Generate yard lines (vertical lines)
  const generateYardLines = useCallback(() => {
    if (!fieldBounds || !fieldDimensions) return [];
    
    const lines = [];
    const pixelsPerYard = fieldDimensions.pixelsPerYard || 40;
    const yardInterval = 5 * pixelsPerYard; // 5-yard intervals
    
    // Start from line of scrimmage if available
    const startX = lineOfScrimmage || ((fieldBounds.dataXMin + fieldBounds.dataXMax) / 2);
    
    // Generate lines going left
    let x = startX;
    let count = 0;
    while (x >= fieldBounds.xMin) {
      const svgStart = dataToSVG(x, fieldBounds.yMin);
      const svgEnd = dataToSVG(x, fieldBounds.yMax);
      
      lines.push(
        <Line
          key={`yard-left-${count}`}
          x1={svgStart.x}
          y1={svgStart.y}
          x2={svgEnd.x}
          y2={svgEnd.y}
          stroke="white"
          strokeWidth="1"
          opacity="0.4"
        />
      );
      
      // Add yard numbers every 10 yards
      if (count > 0 && count % 2 === 0) {
        const textPos = dataToSVG(x, fieldBounds.yMin + 50);
        lines.push(
          <SvgText
            key={`yard-text-left-${count}`}
            x={textPos.x}
            y={textPos.y}
            fill="white"
            fontSize="10"
            textAnchor="middle"
            opacity="0.7"
          >
            {count * 5}
          </SvgText>
        );
      }
      
      x -= yardInterval;
      count++;
    }
    
    // Generate lines going right
    x = startX + yardInterval;
    count = 1;
    while (x <= fieldBounds.xMax) {
      const svgStart = dataToSVG(x, fieldBounds.yMin);
      const svgEnd = dataToSVG(x, fieldBounds.yMax);
      
      lines.push(
        <Line
          key={`yard-right-${count}`}
          x1={svgStart.x}
          y1={svgStart.y}
          x2={svgEnd.x}
          y2={svgEnd.y}
          stroke="white"
          strokeWidth="1"
          opacity="0.4"
        />
      );
      
      // Add yard numbers every 10 yards
      if (count % 2 === 0) {
        const textPos = dataToSVG(x, fieldBounds.yMin + 50);
        lines.push(
          <SvgText
            key={`yard-text-right-${count}`}
            x={textPos.x}
            y={textPos.y}
            fill="white"
            fontSize="10"
            textAnchor="middle"
            opacity="0.7"
          >
            {count * 5}
          </SvgText>
        );
      }
      
      x += yardInterval;
      count++;
    }
    
    return lines;
  }, [fieldBounds, fieldDimensions, lineOfScrimmage, dataToSVG]);

  // Generate sidelines (horizontal lines)
  const generateSidelines = useCallback(() => {
    if (!fieldBounds) return [];
    
    const topLine = dataToSVG(fieldBounds.xMin, fieldBounds.yMin);
    const topLineEnd = dataToSVG(fieldBounds.xMax, fieldBounds.yMin);
    const bottomLine = dataToSVG(fieldBounds.xMin, fieldBounds.yMax);
    const bottomLineEnd = dataToSVG(fieldBounds.xMax, fieldBounds.yMax);
    
    return [
      <Line
        key="sideline-top"
        x1={topLine.x}
        y1={topLine.y}
        x2={topLineEnd.x}
        y2={topLineEnd.y}
        stroke="white"
        strokeWidth="3"
        opacity="0.9"
      />,
      <Line
        key="sideline-bottom"
        x1={bottomLine.x}
        y1={bottomLine.y}
        x2={bottomLineEnd.x}
        y2={bottomLineEnd.y}
        stroke="white"
        strokeWidth="3"
        opacity="0.9"
      />
    ];
  }, [fieldBounds, dataToSVG]);

  // Get marker color based on detection type
  const getMarkerColor = useCallback((detection, mappedPlayer) => {
    const offensivePositions = ['QB', 'RB', 'FB', 'WR', 'TE', 'C', 'OG', 'OT'];
    const defensivePositions = ['DE', 'DT', 'NT', 'LB', 'MLB', 'OLB', 'CB', 'DB', 'S', 'FS', 'SS'];
    
    if (detection.class === 'ref') return '#fbbf24';
    
    if (offensivePositions.includes(detection.class)) {
      return '#3b82f6'; // Blue for offense
    } else if (defensivePositions.includes(detection.class)) {
      return '#ef4444'; // Red for defense
    }
    
    // Fallback to mapped player data
    if (mappedPlayer?.team === 'offense') return '#3b82f6';
    if (mappedPlayer?.team === 'defense') return '#ef4444';
    
    return '#94a3b8'; // Gray for unknown
  }, []);

  // Generate player markers
  const generateMarkers = useCallback(() => {
    if (!detections || detections.length === 0 || !fieldBounds) return [];
    
    return detections.map((detection, index) => {
      const svgPos = dataToSVG(detection.x, detection.y);
      const mappedPlayer = mappedData?.players?.find(p => 
        p.detectionId === detection.detection_id || p.detection_id === detection.detection_id
      );
      const isHighlighted = highlightedIndex === index;
      const color = getMarkerColor(detection, mappedPlayer);
      
      return (
        <G key={detection.detection_id || index}>
          <Circle
            cx={svgPos.x}
            cy={svgPos.y}
            r={isHighlighted ? 10 : 8}
            fill={color}
            stroke={isHighlighted ? "#fbbf24" : "#ffffff"}
            strokeWidth={isHighlighted ? 3 : 2}
            opacity={detection.confidence >= 0.7 ? 0.9 : 0.6}
            onPress={() => onMarkerClick && onMarkerClick(index)}
          />
          <SvgText
            x={svgPos.x}
            y={svgPos.y + 3}
            fontSize="7"
            fill="white"
            textAnchor="middle"
            fontWeight="bold"
          >
            {detection.class === 'ref' ? 'R' : detection.class}
          </SvgText>
        </G>
      );
    });
  }, [detections, mappedData, highlightedIndex, fieldBounds, dataToSVG, getMarkerColor, onMarkerClick]);

  // Generate line of scrimmage
  const generateLineOfScrimmage = useCallback(() => {
    if (!lineOfScrimmage || !fieldBounds) return null;
    
    const svgStart = dataToSVG(lineOfScrimmage, fieldBounds.yMin);
    const svgEnd = dataToSVG(lineOfScrimmage, fieldBounds.yMax);
    
    return (
      <G key="line-of-scrimmage">
        <Line
          x1={svgStart.x}
          y1={svgStart.y}
          x2={svgEnd.x}
          y2={svgEnd.y}
          stroke="#fbbf24"
          strokeWidth="3"
          opacity="0.9"
        />
        <SvgText
          x={svgStart.x + 5}
          y={svgStart.y + 20}
          fill="#fbbf24"
          fontSize="12"
          fontWeight="bold"
          transform={`rotate(90 ${svgStart.x + 5} ${svgStart.y + 20})`}
        >
          LOS
        </SvgText>
      </G>
    );
  }, [lineOfScrimmage, fieldBounds, dataToSVG]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!detections) return null;
    
    const offensivePositions = ['QB', 'RB', 'FB', 'WR', 'TE', 'C', 'OG', 'OT'];
    const defensivePositions = ['DE', 'DT', 'NT', 'LB', 'MLB', 'OLB', 'CB', 'DB', 'S', 'FS', 'SS'];
    
    const offense = detections.filter(d => offensivePositions.includes(d.class));
    const defense = detections.filter(d => defensivePositions.includes(d.class));
    const refs = detections.filter(d => d.class === 'ref');
    const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
    
    return {
      total: detections.length,
      offense: offense.length,
      defense: defense.length,
      refs: refs.length,
      avgConfidence: avgConfidence,
      balance: Math.abs(offense.length - defense.length) <= 3 ? '✓ Balanced' : '⚠ Unbalanced'
    };
  }, [detections]);

  if (!fieldBounds) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🏟️ Field Visualization</Text>
        <Text style={styles.noDataText}>No detection data available</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.title}>🏟️ Field Visualization</Text>
        
        <View style={styles.svgContainer}>
          <Svg 
            width={svgDimensions.width} 
            height={svgDimensions.height}
            style={styles.svg}
          >
            {/* Field background */}
            <Rect width="100%" height="100%" fill="#2E8B57" />
            
            {/* Yard lines */}
            <G>{generateYardLines()}</G>
            
            {/* Sidelines */}
            <G>{generateSidelines()}</G>
            
            {/* Line of scrimmage */}
            {generateLineOfScrimmage()}
            
            {/* Player markers */}
            <G>{generateMarkers()}</G>
          </Svg>
        </View>
        
        {/* Legend and Stats */}
        {/* {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.legendSection}>
              <Text style={styles.sectionTitle}>Legend</Text>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>Offense ({stats.offense})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>Defense ({stats.defense})</Text>
              </View>
              {stats.refs > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
                  <Text style={styles.legendText}>Officials ({stats.refs})</Text>
                </View>
              )}
            </View>
            
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Stats</Text>
              <Text style={styles.statsText}>Total Players: {stats.total}</Text>
              <Text style={styles.statsText}>Team Balance: {stats.balance}</Text>
              <Text style={styles.statsText}>
                Avg Confidence: {(stats.avgConfidence * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        )} */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  svgContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  svg: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  legendSection: {
    flex: 1,
  },
  statsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#4b5563',
  },
  statsText: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
});

export default FieldVisualization;