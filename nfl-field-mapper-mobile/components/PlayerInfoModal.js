import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const PlayerInfoModal = ({ visible, detection, mappedPlayer, onClose }) => {
  if (!detection) return null;

  // Position name mappings for better display
  const positionNames = {
    'QB': 'Quarterback',
    'RB': 'Running Back',
    'FB': 'Fullback',
    'WR': 'Wide Receiver',
    'TE': 'Tight End',
    'C': 'Center',
    'OG': 'Offensive Guard',
    'OT': 'Offensive Tackle',
    'DE': 'Defensive End',
    'DT': 'Defensive Tackle',
    'NT': 'Nose Tackle',
    'LB': 'Linebacker',
    'MLB': 'Middle Linebacker',
    'OLB': 'Outside Linebacker',
    'CB': 'Cornerback',
    'DB': 'Defensive Back',
    'S': 'Safety',
    'FS': 'Free Safety',
    'SS': 'Strong Safety',
    'K': 'Kicker',
    'P': 'Punter',
    'LS': 'Long Snapper',
    'KR': 'Kick Returner',
    'PR': 'Punt Returner',
    'ref': 'Referee'
  };

  const positionName = positionNames[detection.class] || detection.class;
  const isRef = detection.class === 'ref';

  const getTeamColor = (team) => {
    switch (team) {
      case 'offense': return '#10b981';
      case 'defense': return '#ef4444';
      case 'special': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Player Information</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Position */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Position</Text>
              <View style={styles.positionContainer}>
                <Text style={styles.positionAbbr}>{detection.class}</Text>
                <Text style={styles.positionName}>{positionName}</Text>
              </View>
            </View>

            {/* Team (if not referee) */}
            {!isRef && mappedPlayer && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Team</Text>
                <View style={styles.teamContainer}>
                  <View 
                    style={[
                      styles.teamDot, 
                      { backgroundColor: getTeamColor(mappedPlayer.team) }
                    ]} 
                  />
                  <Text style={[
                    styles.teamText,
                    { color: getTeamColor(mappedPlayer.team) }
                  ]}>
                    {mappedPlayer.team.charAt(0).toUpperCase() + mappedPlayer.team.slice(1)}
                  </Text>
                </View>
              </View>
            )}

            {/* Confidence */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detection Confidence</Text>
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceFill, 
                      { width: `${detection.confidence * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {Math.round(detection.confidence * 100)}%
                </Text>
              </View>
            </View>

            {/* Field Position */}
            {mappedPlayer && mappedPlayer.coordinates && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Field Position (Yards)</Text>
                <View style={styles.coordinatesGrid}>
                  <View style={styles.coordinateItem}>
                    <Text style={styles.coordinateLabel}>X (Line of Scrimmage)</Text>
                    <Text style={styles.coordinateValue}>
                      {mappedPlayer.coordinates.xYards?.toFixed(1) || 'N/A'} yds
                    </Text>
                  </View>
                  <View style={styles.coordinateItem}>
                    <Text style={styles.coordinateLabel}>Y (Field Width)</Text>
                    <Text style={styles.coordinateValue}>
                      {mappedPlayer.coordinates.yYards?.toFixed(1) || 'N/A'} yds
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Image Position */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Image Position (Pixels)</Text>
              <View style={styles.coordinatesGrid}>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>X Position</Text>
                  <Text style={styles.coordinateValue}>
                    {detection.x.toFixed(0)}px
                  </Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Y Position</Text>
                  <Text style={styles.coordinateValue}>
                    {detection.y.toFixed(0)}px
                  </Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Width</Text>
                  <Text style={styles.coordinateValue}>
                    {detection.width}px
                  </Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Height</Text>
                  <Text style={styles.coordinateValue}>
                    {detection.height}px
                  </Text>
                </View>
              </View>
            </View>

            {/* Detection ID */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detection ID</Text>
              <Text style={styles.detectionId}>{detection.detection_id}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: screenWidth - 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionAbbr: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positionName: {
    fontSize: 16,
    color: '#6b7280',
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  teamText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 40,
  },
  coordinatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  coordinateItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  detectionId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
});

export default PlayerInfoModal;
