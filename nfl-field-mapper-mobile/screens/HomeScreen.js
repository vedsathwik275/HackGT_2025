import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import PlaysApiClient from '../services/PlaysApiClient';

const HomeScreen = ({ onNavigate, onViewSavedPlay }) => {
  const [savedPlays, setSavedPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playsClient] = useState(new PlaysApiClient());

  useEffect(() => {
    loadSavedPlays();
  }, []);

  const loadSavedPlays = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading saved plays...');
      
      // Get all play IDs
      const playIds = await playsClient.getPlays();
      console.log('📋 Found play IDs:', playIds);
      
      // Fetch data for each play
      const playsData = [];
      for (const playId of playIds) {
        try {
          const playData = await playsClient.getPlayData(playId);
          if (playData) {
            playsData.push({
              id: playId,
              ...playData,
              // Ensure we have required fields
              playName: playData.playName || playId,
              timestamp: playData.timestamp || new Date().toISOString(),
              playerCount: playData.playerCount || (playData.detections ? playData.detections.length : 0),
            });
          }
        } catch (error) {
          console.warn(`Failed to load data for play ${playId}:`, error);
        }
      }
      
      // Sort by timestamp (newest first)
      playsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setSavedPlays(playsData);
      console.log('✅ Loaded plays:', playsData.length);
    } catch (error) {
      console.error('❌ Failed to load saved plays:', error);
      Alert.alert('Error', 'Failed to load saved plays. Please check your connection.');
      // Fallback to empty array
      setSavedPlays([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlay = (play) => {
    console.log('👀 Viewing saved play:', play.playName);
    if (onViewSavedPlay) {
      onViewSavedPlay(play);
    }
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  const renderPlayItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.playItem} 
      onPress={() => handleViewPlay(item)}
    >
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailText}>🏈</Text>
      </View>
      <View style={styles.playInfo}>
        <Text style={styles.playTitle}>{item.playName}</Text>
        <Text style={styles.playDate}>{formatDate(item.timestamp)}</Text>
        <Text style={styles.playerCount}>{item.playerCount} players detected</Text>
      </View>
      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No saved plays yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Capture and analyze a play to see it here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NFL Field Mapper</Text>
      <Text style={styles.subtitle}>Capture and analyze football plays</Text>
      
      {/* Main Capture Button */}
      <TouchableOpacity 
        style={styles.captureButton} 
        onPress={() => onNavigate('camera')}
      >
        <Text style={styles.captureButtonText}>📷 Capture New Play</Text>
      </TouchableOpacity>

      {/* Saved Plays Section */}
      <View style={styles.previousPlaysSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Plays</Text>
          {!loading && (
            <TouchableOpacity onPress={loadSavedPlays} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>🔄</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading saved plays...</Text>
          </View>
        ) : (
          <FlatList
            data={savedPlays}
            renderItem={renderPlayItem}
            keyExtractor={(item) => item.id}
            style={styles.playsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  captureButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  captureButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  previousPlaysSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 18,
  },
  playsList: {
    flex: 1,
  },
  playItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  thumbnailText: {
    fontSize: 24,
  },
  playInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  playDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  playerCount: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 20,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default HomeScreen; 