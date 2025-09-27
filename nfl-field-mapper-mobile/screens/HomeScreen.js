import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';

const HomeScreen = ({ onNavigate }) => {
  // Dummy data for previous play captures
  const previousPlays = [
    {
      id: '1',
      title: 'Offensive Formation - 3rd Down',
      date: '2024-01-15',
      thumbnail: null, // We'll add image support later
      playerCount: 22,
    },
    {
      id: '2',
      title: 'Red Zone Defense',
      date: '2024-01-14',
      thumbnail: null,
      playerCount: 18,
    },
    {
      id: '3',
      title: 'Special Teams Formation',
      date: '2024-01-13',
      thumbnail: null,
      playerCount: 20,
    },
  ];

  const renderPlayItem = ({ item }) => (
    <TouchableOpacity style={styles.playItem} onPress={() => console.log('View play:', item.id)}>
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailText}>📸</Text>
      </View>
      <View style={styles.playInfo}>
        <Text style={styles.playTitle}>{item.title}</Text>
        <Text style={styles.playDate}>{item.date}</Text>
        <Text style={styles.playerCount}>{item.playerCount} players detected</Text>
      </View>
    </TouchableOpacity>
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

      {/* Previous Plays Section */}
      <View style={styles.previousPlaysSection}>
        <Text style={styles.sectionTitle}>Previous Captures</Text>
        <FlatList
          data={previousPlays}
          renderItem={renderPlayItem}
          keyExtractor={(item) => item.id}
          style={styles.playsList}
          showsVerticalScrollIndicator={false}
        />
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
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
});

export default HomeScreen; 