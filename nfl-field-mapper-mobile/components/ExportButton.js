import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const ExportButton = ({ onExportData, disabled = false }) => {
  const handleExport = () => {
    try {
      onExportData();
      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      Alert.alert('Error', `Failed to export data: ${error.message}`);
    }
  };

  if (!onExportData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.exportButton, disabled && styles.disabledButton]} 
        onPress={handleExport}
        disabled={disabled}
      >
        <Text style={styles.exportButtonText}>📤 Export Data</Text>
      </TouchableOpacity>
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
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 150,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});

export default ExportButton; 