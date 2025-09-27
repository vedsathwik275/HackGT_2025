import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Auto dismiss
    setTimeout(() => {
      dismissNotification(id);
    }, duration);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Fade out if no more notifications
    if (notifications.length <= 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Global notification methods
  useEffect(() => {
    global.showNotification = showNotification;
    return () => {
      delete global.showNotification;
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {notifications.map(notification => (
        <View
          key={notification.id}
          style={[
            styles.notification,
            notification.type === 'error' && styles.errorNotification,
            notification.type === 'success' && styles.successNotification,
            notification.type === 'warning' && styles.warningNotification,
          ]}
        >
          <Text style={styles.notificationText}>{notification.message}</Text>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => dismissNotification(notification.id)}
          >
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorNotification: {
    backgroundColor: '#ef4444',
  },
  successNotification: {
    backgroundColor: '#10b981',
  },
  warningNotification: {
    backgroundColor: '#f59e0b',
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NotificationManager;
