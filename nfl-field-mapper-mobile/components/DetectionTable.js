import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

const DetectionTable = ({ 
  detections, 
  mappedData, 
  highlightedIndex, 
  onRowClick, 
  onExportData 
}) => {
  const handleExport = () => {
    try {
      onExportData();
      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      Alert.alert('Error', `Failed to export data: ${error.message}`);
    }
  };

  if (!detections || detections.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📋 Detection Details</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No detections available. Upload an image and run detection first.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Detection Details</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportButtonText}>📤 Export</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.idColumn]}>ID</Text>
            <Text style={[styles.headerCell, styles.typeColumn]}>Type</Text>
            <Text style={[styles.headerCell, styles.positionColumn]}>Position (x,y)</Text>
            <Text style={[styles.headerCell, styles.sizeColumn]}>Size</Text>
            <Text style={[styles.headerCell, styles.confidenceColumn]}>Confidence</Text>
            <Text style={[styles.headerCell, styles.fieldPositionColumn]}>Field Position</Text>
          </View>
          
          {/* Table Rows */}
          <ScrollView style={styles.tableBody}>
            {detections.map((detection, index) => {
              const mappedPlayer = mappedData?.players.find(p => p.detectionId === detection.detection_id) ||
                                 mappedData?.referees.find(r => r.detectionId === detection.detection_id);
              const isHighlighted = highlightedIndex === index;
              
              return (
                <TouchableOpacity
                  key={detection.detection_id}
                  style={[
                    styles.tableRow,
                    isHighlighted && styles.highlightedRow
                  ]}
                  onPress={() => onRowClick && onRowClick(index)}
                >
                  <Text style={[styles.cell, styles.idColumn]}>
                    {index + 1}
                  </Text>
                  
                  <View style={[styles.cell, styles.typeColumn]}>
                    <View style={styles.typeContainer}>
                      <View style={[
                        styles.typeDot,
                        { backgroundColor: getTypeColor(detection, mappedPlayer) }
                      ]} />
                      <Text style={styles.typeText}>
                        {detection.class === 'ref' ? 'Referee' : 
                         mappedPlayer?.team === 'offense' ? 'Offense' :
                         mappedPlayer?.team === 'defense' ? 'Defense' : 'Player'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.cell, styles.positionColumn]}>
                    ({Math.round(detection.x)}, {Math.round(detection.y)})
                  </Text>
                  
                  <Text style={[styles.cell, styles.sizeColumn]}>
                    {Math.round(detection.width)} × {Math.round(detection.height)}
                  </Text>
                  
                  <Text style={[
                    styles.cell, 
                    styles.confidenceColumn,
                    detection.confidence >= 0.7 ? styles.highConfidence : styles.lowConfidence
                  ]}>
                    {Math.round(detection.confidence * 100)}%
                  </Text>
                  
                  <Text style={[styles.cell, styles.fieldPositionColumn]}>
                    {mappedPlayer ? (
                      `(${mappedPlayer.coordinates.xYards.toFixed(1)}, ${mappedPlayer.coordinates.yYards.toFixed(1)}) yd`
                    ) : (
                      'N/A'
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const getTypeColor = (detection, mappedPlayer) => {
  if (detection.class === 'ref') return '#fbbf24';
  if (mappedPlayer?.team === 'offense') return '#10b981';
  if (mappedPlayer?.team === 'defense') return '#ef4444';
  return '#3b82f6';
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  exportButton: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  table: {
    minWidth: 800, // Ensure table is wide enough
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  highlightedRow: {
    backgroundColor: '#fef3c7',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'left',
  },
  cell: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'left',
    paddingRight: 8,
  },
  idColumn: {
    width: 40,
  },
  typeColumn: {
    width: 100,
  },
  positionColumn: {
    width: 120,
  },
  sizeColumn: {
    width: 80,
  },
  confidenceColumn: {
    width: 80,
  },
  fieldPositionColumn: {
    width: 140,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    color: '#1f2937',
  },
  highConfidence: {
    color: '#059669',
    fontWeight: '600',
  },
  lowConfidence: {
    color: '#dc2626',
    fontWeight: '600',
  },
});

export default DetectionTable;
