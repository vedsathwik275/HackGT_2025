import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const ProcessingStatus = ({ isProcessing, message }) => {
  if (!isProcessing) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#2563eb" style={styles.spinner} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Processing Image...</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#2563eb',
  },
});

export default ProcessingStatus;
