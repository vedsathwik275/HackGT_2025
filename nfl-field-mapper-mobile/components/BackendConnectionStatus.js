import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import CoordinateMapperApiClient from '../services/CoordinateMapperApiClient';
import BackendConfigModal from './BackendConfigModal';

const BackendConnectionStatus = ({ apiClient = null }) => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const client = apiClient || new CoordinateMapperApiClient();

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const status = await client.testConnection();
      setConnectionStatus(status);
    } catch (error) {
      setConnectionStatus({
        connected: false,
        error: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check connection on mount
    checkConnection();
  }, []);

  const getStatusColor = () => {
    if (connectionStatus === null) return '#6b7280'; // gray
    return connectionStatus.connected ? '#10b981' : '#ef4444'; // green or red
  };

  const getStatusText = () => {
    if (connectionStatus === null) return 'Checking...';
    if (connectionStatus.connected) {
      return `✅ Backend Connected (${connectionStatus.status})`;
    }
    return '❌ Backend Offline';
  };

  const getStatusDescription = () => {
    if (connectionStatus === null) return 'Testing backend connection...';
    if (connectionStatus.connected) {
      return `Service: ${connectionStatus.service || 'NFL Field Mapper Backend'}\nURL: ${connectionStatus.url}`;
    }
    return `${connectionStatus.error || 'Unable to connect to backend server'}\nURL: ${connectionStatus.url}\nPlatform: ${connectionStatus.platform}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>{getStatusText()}</Text>
          <Text style={styles.statusDescription}>{getStatusDescription()}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={checkConnection}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Text style={styles.refreshIcon}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {connectionStatus && !connectionStatus.connected && (
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 Troubleshooting:</Text>
          <Text style={styles.helpText}>1. Ensure backend is running: npm run dev</Text>
          <Text style={styles.helpText}>2. Platform: {connectionStatus.platform}</Text>
          <Text style={styles.helpText}>3. Trying URL: {connectionStatus.url}</Text>
          <Text style={styles.helpText}>4. iOS: use localhost, Android: use 10.0.2.2</Text>
          <Text style={styles.helpText}>5. Physical devices: use computer's IP address</Text>
          <TouchableOpacity
            style={styles.configButton}
            onPress={() => setShowConfigModal(true)}
          >
            <Text style={styles.configButtonText}>⚙️ Configure URL</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <BackendConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        apiClient={client}
        onConfigUpdate={() => {
          // Recheck connection after URL update
          setTimeout(checkConnection, 500);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  refreshIcon: {
    fontSize: 16,
  },
  helpSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 2,
  },
  configButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  configButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default BackendConnectionStatus; 