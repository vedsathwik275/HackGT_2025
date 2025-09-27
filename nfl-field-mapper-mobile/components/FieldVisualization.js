import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Circle, G } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

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
    const maxWidth = screenWidth - 40; // Account for padding
    const aspectRatio = 1000 / 533; // Original aspect ratio
    const fieldWidth = maxWidth;
    const fieldHeight = fieldWidth / aspectRatio;
    
    return { width: fieldWidth, height: fieldHeight };
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
        <Line
          key={`yard-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={fieldScale.height}
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.8"
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
        <G key={`hash-${i}`}>
          <Line 
            x1={x} 
            y1={topHashY - 10} 
            x2={x} 
            y2={topHashY + 10} 
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.6"
          />
          <Line 
            x1={x} 
            y1={bottomHashY - 10} 
            x2={x} 
            y2={bottomHashY + 10} 
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.6"
          />
        </G>
      );
    }
    return marks;
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
        <G key={detection.detection_id}>
          <Circle
            cx={svgPos.x}
            cy={svgPos.y}
            r={isHighlighted ? 12 : 8}
            fill={color}
            stroke={isHighlighted ? "#000" : "#fff"}
            strokeWidth={isHighlighted ? 3 : 2}
            opacity={detection.confidence >= 0.7 ? 0.9 : 0.6}
            onPress={() => onMarkerClick && onMarkerClick(index)}
          />
          <SvgText
            x={svgPos.x}
            y={svgPos.y + 4}
            fontSize="10"
            fill="#ffffff"
            textAnchor="middle"
            fontWeight="bold"
          >
            {detection.class === 'ref' ? 'R' : 
             mappedPlayer?.team === 'offense' ? 'O' : 
             mappedPlayer?.team === 'defense' ? 'D' : 'P'}
          </SvgText>
        </G>
      );
    });
  }, [detections, mappedData, highlightedIndex, pixelToSVG, getMarkerColor, onMarkerClick]);

  // Generate line of scrimmage
  const generateLineOfScrimmage = useCallback(() => {
    if (!lineOfScrimmage || !fieldDimensions) return null;
    
    const svgPos = pixelToSVG(lineOfScrimmage, fieldScale.height / 2);
    
    return (
      <Line
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
    <View style={styles.container}>
      <Text style={styles.title}>🏟️ Field Visualization</Text>
      
      <View style={styles.fieldContainer}>
        <Svg width={fieldScale.width} height={fieldScale.height} style={styles.svg}>
          {/* Field background */}
          <Rect width="100%" height="100%" fill="#2d5a27" />
          
          {/* End zones */}
          <Rect x="0" y="0" width={fieldScale.width / 12} height="100%" fill="#1f4b1f" />
          <Rect x={fieldScale.width * 11/12} y="0" width={fieldScale.width / 12} height="100%" fill="#1f4b1f" />
          
          {/* Yard lines */}
          <G>{generateYardLines()}</G>
          
          {/* Hash marks */}
          <G>{generateHashMarks()}</G>
          
          {/* Line of scrimmage */}
          {generateLineOfScrimmage()}
          
          {/* Detection markers */}
          <G>{generateMarkers()}</G>
        </Svg>
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Offense</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Defense</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Unclassified</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
            <Text style={styles.legendText}>Referees</Text>
          </View>
          
          {lineOfScrimmage && (
            <View style={styles.legendItem}>
              <View style={styles.legendLine} />
              <Text style={styles.legendText}>Line of Scrimmage</Text>
            </View>
          )}
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9ca3af', opacity: 0.6 }]} />
            <Text style={styles.legendText}>Low Confidence</Text>
          </View>
        </View>
      </View>
    </View>
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
  fieldContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  svg: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  legendContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendLine: {
    width: 20,
    height: 3,
    backgroundColor: '#fbbf24',
    marginRight: 8,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default FieldVisualization;
