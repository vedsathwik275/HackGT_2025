import React, { useState, useEffect, useCallback } from 'react';

const NotificationManager = () => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        const notification = { id, message, type, duration };
        
        setNotifications(prev => [...prev, notification]);
        
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Expose methods globally for easy access
    useEffect(() => {
        window.showNotification = addNotification;
        return () => {
            delete window.showNotification;
        };
    }, [addNotification]);

    // Show welcome message on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            addNotification('Welcome! Upload an image or load sample data to get started.', 'info', 3000);
        }, 1000);

        return () => clearTimeout(timer);
    }, [addNotification]);

    const getNotificationStyles = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-blue-500 text-white';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${getNotificationStyles(notification.type)}`}
                >
                    <div className="flex items-center justify-between">
                        <span>{notification.message}</span>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="ml-2 text-white hover:text-gray-200 font-bold text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationManager; 