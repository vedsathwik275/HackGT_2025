import React, { useState, useCallback } from 'react';

const BackendConnectionStatus = ({ 
    backendStatus, 
    processingMode, 
    onProcessingModeChange,
    onTestConnection,
    onConfigureBackend 
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleTestConnection = useCallback(async () => {
        setIsLoading(true);
        try {
            await onTestConnection();
        } catch (error) {
            console.error('Connection test failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [onTestConnection]);

    const getStatusIndicator = () => {
        switch (backendStatus) {
            case 'online':
                return { color: 'bg-green-500', icon: '🟢', text: 'Online' };
            case 'offline':
                return { color: 'bg-red-500', icon: '🔴', text: 'Offline' };
            default:
                return { color: 'bg-yellow-500', icon: '🟡', text: 'Unknown' };
        }
    };

    const getModeIcon = (mode) => {
        switch (mode) {
            case 'backend': return '🌐';
            case 'local': return '🏠';
            case 'auto': return '🔄';
            default: return '❓';
        }
    };

    const status = getStatusIndicator();

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${status.color} animate-pulse`}></div>
                        <span className="font-medium text-gray-700">
                            Backend API: {status.text}
                        </span>
                        {status.icon && <span className="text-sm">{status.icon}</span>}
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Processing:</span>
                        <div className="flex items-center space-x-1">
                            <span className="text-sm">{getModeIcon(processingMode)}</span>
                            <select
                                value={processingMode}
                                onChange={(e) => onProcessingModeChange(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="auto">Auto</option>
                                <option value="backend">Backend Only</option>
                                <option value="local">Local Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleTestConnection}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Testing...</span>
                            </>
                        ) : (
                            <>
                                <span>🔄</span>
                                <span>Test</span>
                            </>
                        )}
                    </button>
                    
                    {onConfigureBackend && (
                        <button
                            onClick={onConfigureBackend}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center space-x-1"
                        >
                            <span>⚙️</span>
                            <span>Config</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Status description */}
            <div className="mt-3 text-xs text-gray-500">
                {processingMode === 'auto' && (
                    <span>
                        🔄 Auto mode: Uses backend when available, falls back to local processing
                    </span>
                )}
                {processingMode === 'backend' && (
                    <span>
                        🌐 Backend mode: Requires backend server connection for processing
                    </span>
                )}
                {processingMode === 'local' && (
                    <span>
                        🏠 Local mode: All processing done in browser (no backend required)
                    </span>
                )}
            </div>

            {/* Connection hints */}
            {backendStatus === 'offline' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>💡 Backend Connection Tips:</strong>
                    <ul className="mt-1 ml-4 list-disc">
                        <li>Ensure the backend server is running on port 3000</li>
                        <li>Check that CORS is configured properly</li>
                        <li>Verify your network connection</li>
                        <li>Use the Config button to set a custom backend URL</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BackendConnectionStatus; 