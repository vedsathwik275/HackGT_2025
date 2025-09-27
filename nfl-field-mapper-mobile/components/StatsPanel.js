import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatsPanel = ({ statistics, fieldDimensions, lineOfScrimmage }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Detection Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.blueCard]}>
          <Text style={[styles.statValue, styles.blueText]}>{statistics.playerCount}</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
        
        <View style={[styles.statCard, styles.yellowCard]}>
          <Text style={[styles.statValue, styles.yellowText]}>{statistics.refCount}</Text>
          <Text style={styles.statLabel}>Referees</Text>
        </View>
        
        <View style={[styles.statCard, styles.greenCard]}>
          <Text style={[styles.statValue, styles.greenText]}>{statistics.totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={[styles.statCard, styles.purpleCard]}>
          <Text style={[styles.statValue, styles.purpleText]}>{statistics.avgConfidence}%</Text>
          <Text style={styles.statLabel}>Avg Confidence</Text>
        </View>
      </View>

      {/* Team Stats */}
      {statistics.offenseCount > 0 || statistics.defenseCount > 0 ? (
        <View style={styles.teamStatsContainer}>
          <Text style={styles.teamStatsTitle}>Team Distribution</Text>
          <View style={styles.teamStatsGrid}>
            <View style={[styles.statCard, styles.greenCard]}>
              <Text style={[styles.statValue, styles.greenText]}>{statistics.offenseCount}</Text>
              <Text style={styles.statLabel}>Offense</Text>
            </View>
            
            <View style={[styles.statCard, styles.redCard]}>
              <Text style={[styles.statValue, styles.redText]}>{statistics.defenseCount}</Text>
              <Text style={styles.statLabel}>Defense</Text>
            </View>
            
            <View style={[styles.statCard, styles.grayCard]}>
              <Text style={[styles.statValue, styles.grayText]}>
                {statistics.teamBalance === 'balanced' ? '✓' : '⚠'}
              </Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Field Dimensions */}
      {fieldDimensions ? (
        <View style={styles.fieldDimensionsContainer}>
          <Text style={styles.fieldDimensionsTitle}>Field Metrics</Text>
          <View style={styles.fieldDimensionsGrid}>
            <View style={styles.fieldMetric}>
              <Text style={styles.fieldMetricValue}>
                {fieldDimensions.pixelsPerYard?.toFixed(1) || 'N/A'}
              </Text>
              <Text style={styles.fieldMetricLabel}>Pixels/Yard</Text>
            </View>
            
            <View style={styles.fieldMetric}>
              <Text style={styles.fieldMetricValue}>
                {fieldDimensions.lengthYards?.toFixed(1) || 'N/A'}
              </Text>
              <Text style={styles.fieldMetricLabel}>Field Length (yd)</Text>
            </View>
          </View>
        </View>
      ) : null}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueCard: {
    backgroundColor: '#dbeafe',
  },
  yellowCard: {
    backgroundColor: '#fef3c7',
  },
  greenCard: {
    backgroundColor: '#dcfce7',
  },
  purpleCard: {
    backgroundColor: '#f3e8ff',
  },
  redCard: {
    backgroundColor: '#fee2e2',
  },
  grayCard: {
    backgroundColor: '#f3f4f6',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  blueText: {
    color: '#2563eb',
  },
  yellowText: {
    color: '#d97706',
  },
  greenText: {
    color: '#059669',
  },
  purpleText: {
    color: '#7c3aed',
  },
  redText: {
    color: '#dc2626',
  },
  grayText: {
    color: '#6b7280',
  },
  teamStatsContainer: {
    marginTop: 20,
  },
  teamStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  teamStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldDimensionsContainer: {
    marginTop: 20,
  },
  fieldDimensionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  fieldDimensionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldMetric: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  fieldMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  fieldMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default StatsPanel;
