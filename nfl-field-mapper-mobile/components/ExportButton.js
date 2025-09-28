import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const ExportButton = ({ onExportData, disabled = false }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const result = await onExportData();
      
      if (result && result.success) {
        Alert.alert(
          '✅ Export Successful!', 
          `File: ${result.filename}\nSize: ${result.size} bytes`,
          [{ text: 'OK' }]
        );
      } else if (result && !result.success) {
        Alert.alert('❌ Export Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('❌ Export Error', `Failed to export data: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!onExportData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.exportButton, 
          (disabled || isExporting) && styles.disabledButton
        ]} 
        onPress={handleExport}
        disabled={disabled || isExporting}
      >
        <Text style={styles.exportButtonText}>
          {isExporting ? '⏳ Exporting...' : '📤 Export Data'}
        </Text>
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