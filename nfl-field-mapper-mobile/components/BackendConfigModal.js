import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';

const BackendConfigModal = ({ visible, onClose, apiClient, onConfigUpdate }) => {
  const [customURL, setCustomURL] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const getDefaultURLs = () => {
    return [
      { label: 'Localhost (iOS/Web)', url: 'http://localhost:3000' },
      { label: 'Android Emulator', url: 'http://10.0.2.2:3000' },
      { label: '127.0.0.1', url: 'http://127.0.0.1:3000' },
    ];
  };

  const testURL = async (url) => {
    setIsTesting(true);
    try {
      // Create temporary client with the test URL
      const tempClient = { ...apiClient };
      tempClient.setBaseURL(url);
      
      const result = await tempClient.testConnection();
      
      if (result.connected) {
        Alert.alert(
          '✅ Connection Successful!',
          `Successfully connected to backend at ${url}`,
          [
            {
              text: 'Use This URL',
              onPress: () => {
                apiClient.setBaseURL(url);
                onConfigUpdate && onConfigUpdate(url);
                onClose();
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('❌ Connection Failed', result.error);
      }
    } catch (error) {
      Alert.alert('❌ Test Failed', error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const testCustomURL = () => {
    if (!customURL.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }
    
    let url = customURL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    
    testURL(url);
  };

  const getCurrentInfo = () => {
    const info = [
      `Current Platform: ${Platform.OS}`,
      `Current URL: ${apiClient.getConfig().baseURL}`,
      `Auto-detected URL: ${apiClient.getDefaultBaseURL()}`,
    ];
    
    return info.join('\n');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Backend Configuration</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{getCurrentInfo()}</Text>
          </View>

          <Text style={styles.sectionTitle}>Quick Options</Text>
          {getDefaultURLs().map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickOption}
              onPress={() => testURL(option.url)}
              disabled={isTesting}
            >
              <View style={styles.quickOptionContent}>
                <Text style={styles.quickOptionTitle}>{option.label}</Text>
                <Text style={styles.quickOptionURL}>{option.url}</Text>
              </View>
              <Text style={styles.testIcon}>🧪</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Custom URL</Text>
          <TextInput
            style={styles.textInput}
            value={customURL}
            onChangeText={setCustomURL}
            placeholder="Enter backend URL (e.g., 192.168.1.100:3000)"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity
            style={[styles.testButton, isTesting && styles.disabledButton]}
            onPress={testCustomURL}
            disabled={isTesting}
          >
            <Text style={styles.testButtonText}>
              {isTesting ? '⏳ Testing...' : '🧪 Test Custom URL'}
            </Text>
          </TouchableOpacity>

          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>💡 Help</Text>
            <Text style={styles.helpText}>• iOS Simulator: Use localhost or 127.0.0.1</Text>
            <Text style={styles.helpText}>• Android Emulator: Use 10.0.2.2</Text>
            <Text style={styles.helpText}>• Physical Device: Use your computer's IP address</Text>
            <Text style={styles.helpText}>• Find your IP: Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 20,
  },
  infoBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  quickOptionContent: {
    flex: 1,
  },
  quickOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  quickOptionURL: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  testIcon: {
    fontSize: 20,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    color: '#1f2937',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  testButton: {
    backgroundColor: '#059669',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  helpSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
  },
});

export default BackendConfigModal; 