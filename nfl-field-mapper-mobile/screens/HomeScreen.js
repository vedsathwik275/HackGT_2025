import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import PlaysApiClient from '../services/PlaysApiClient';

const formatDate = (timestamp) => {
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return 'Unknown date';
  }
};

const HomeScreen = ({ onNavigate, onViewSavedPlay }) => {
  const [savedPlays, setSavedPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playsClient] = useState(new PlaysApiClient());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Filter plays based on search text
  const filteredPlays = useMemo(() => {
    if (!searchText.trim()) {
      return savedPlays;
    }
    return savedPlays.filter(play => 
      play.playName.toLowerCase().includes(searchText.toLowerCase()) ||
      formatDate(play.timestamp).toLowerCase().includes(searchText.toLowerCase())
    );
  }, [savedPlays, searchText]);

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

  const handleChatPress = () => {
    console.log('🗣️ Opening chat...');
    if (onNavigate) {
      onNavigate('chat');
    }
  };

  const handleTopGamesPress = () => {
    console.log('🏆 Opening chat with top games question...');
    if (onNavigate) {
      onNavigate('chat', { preloadedMessage: 'What are the most exciting games happening right now?' });
    }
  };

  const handleLiveScoresPress = () => {
    console.log('⚡ Opening chat with live scores question...');
    if (onNavigate) {
      onNavigate('chat', { preloadedMessage: 'Show me all the current live scores' });
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
      {/* Centered Content */}
      <View style={styles.centeredContent}>
        <Text style={styles.title}>Gameday Companion</Text>
        
        {/* Main Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={handleChatPress}
          >
            <Text style={styles.chatButtonText}>💬 Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={() => onNavigate('camera')}
          >
            <Text style={styles.captureButtonText}>📷 Capture</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Action Buttons */}
        <View style={styles.secondaryButtonContainer}>
          <TouchableOpacity 
            style={styles.topGamesButton} 
            onPress={handleTopGamesPress}
          >
            <Text style={styles.topGamesButtonText}>🏆 Top Games</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.liveScoresButton} 
            onPress={handleLiveScoresPress}
          >
            <Text style={styles.liveScoresButtonText}>⚡ Live Scores</Text>
          </TouchableOpacity>
        </View>

        {/* Saved Plays Section */}
        <View style={styles.previousPlaysSection}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setIsCollapsed(!isCollapsed)}
          >
            <Text style={styles.sectionTitle}>Saved Plays</Text>
            <View style={styles.headerButtons}>
              {!loading && !isCollapsed && (
                <TouchableOpacity onPress={loadSavedPlays} style={styles.refreshButton}>
                  {/* <Text style={styles.refreshButtonText}>🔄</Text> */}
                </TouchableOpacity>
              )}
              <Text style={styles.collapseIcon}>
                {isCollapsed ? '▶' : '▼'}
              </Text>
            </View>
          </TouchableOpacity>
          
          {!isCollapsed && (
            <>
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search plays..."
                  value={searchText}
                  onChangeText={setSearchText}
                  clearButtonMode="while-editing"
                />
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.loadingText}>Loading saved plays...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredPlays}
                  renderItem={renderPlayItem}
                  keyExtractor={(item) => item.id}
                  style={styles.playsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={() => (
                    searchText ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No plays found</Text>
                        <Text style={styles.emptyStateSubtext}>
                          Try adjusting your search terms
                        </Text>
                      </View>
                    ) : renderEmptyState()
                  )}
                />
              )}
            </>
          )}
        </View>
      </View>
      
      {/* Floating Chat Button (Bottom Left) */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={handleChatPress}
      >
        <Text style={styles.floatingChatButtonText}>💬</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    marginTop: 70,
  },
  centeredContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  captureButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  captureButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingChatButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  secondaryButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  topGamesButton: {
    flex: 1,
    backgroundColor: '#4f46e5', // A darker blue for top games
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topGamesButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  liveScoresButton: {
    flex: 1,
    backgroundColor: '#ef4444', // A red for live scores
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  liveScoresButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previousPlaysSection: {
    flex: 1,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 18,
  },
  collapseIcon: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 16,
    width: '100%',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  playsList: {
    flex: 1,
    width: '100%',
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
    textAlign: 'center',
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
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default HomeScreen; 