import React, { useState, useCallback, useEffect } from 'react';

const BackendConfigModal = ({ 
    isOpen, 
    onClose, 
    apiClient,
    onConfigurationSaved 
}) => {
    const [backendUrl, setBackendUrl] = useState('');
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionTestResult, setConnectionTestResult] = useState(null);

    // Initialize with current API client URL
    useEffect(() => {
        if (isOpen && apiClient) {
            const config = apiClient.getConfig();
            setBackendUrl(config.baseURL || '');
            setConnectionTestResult(null);
        }
    }, [isOpen, apiClient]);

    const handleTestConnection = useCallback(async () => {
        if (!backendUrl.trim()) {
            setConnectionTestResult({ 
                success: false, 
                error: 'Please enter a backend URL' 
            });
            return;
        }

        setIsTestingConnection(true);
        setConnectionTestResult(null);

        try {
            // Temporarily set the URL for testing
            const tempClient = { ...apiClient };
            tempClient.setBaseURL(backendUrl.trim());
            
            const result = await tempClient.testConnection();
            setConnectionTestResult({
                success: result.connected,
                data: result,
                error: result.connected ? null : result.error
            });
        } catch (error) {
            setConnectionTestResult({
                success: false,
                error: error.message
            });
        } finally {
            setIsTestingConnection(false);
        }
    }, [backendUrl, apiClient]);

    const handleSaveConfiguration = useCallback(async () => {
        if (!backendUrl.trim()) {
            setConnectionTestResult({ 
                success: false, 
                error: 'Please enter a backend URL' 
            });
            return;
        }

        // Update the API client configuration
        apiClient.setBaseURL(backendUrl.trim());
        
        // Notify parent component
        if (onConfigurationSaved) {
            onConfigurationSaved(backendUrl.trim());
        }

        // Test the new connection
        await handleTestConnection();
        
        // Close modal after a brief delay if connection is successful
        setTimeout(() => {
            if (connectionTestResult?.success !== false) {
                onClose();
            }
        }, 1000);
    }, [backendUrl, apiClient, onConfigurationSaved, onClose, connectionTestResult, handleTestConnection]);

    const handlePresetUrl = useCallback((preset) => {
        setBackendUrl(preset);
        setConnectionTestResult(null);
    }, []);

    const commonPresets = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.100:3000', // Common local network IP
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">⚙️ Backend Configuration</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="backend-url" className="block text-sm font-medium text-gray-700 mb-1">
                            Backend URL
                        </label>
                        <input
                            id="backend-url"
                            type="url"
                            value={backendUrl}
                            onChange={(e) => {
                                setBackendUrl(e.target.value);
                                setConnectionTestResult(null);
                            }}
                            placeholder="http://localhost:3000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <p className="text-sm text-gray-600 mb-2">Quick Presets:</p>
                        <div className="flex flex-wrap gap-2">
                            {commonPresets.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetUrl(preset)}
                                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                                        backendUrl === preset
                                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                                            : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Connection Test Result */}
                    {connectionTestResult && (
                        <div className={`p-3 rounded-md text-sm ${
                            connectionTestResult.success 
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            {connectionTestResult.success ? (
                                <div>
                                    <div className="font-medium">✅ Connection Successful!</div>
                                    {connectionTestResult.data && (
                                        <div className="text-xs mt-1">
                                            Service: {connectionTestResult.data.service || 'Unknown'}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div className="font-medium">❌ Connection Failed</div>
                                    <div className="text-xs mt-1">{connectionTestResult.error}</div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex space-x-3 pt-2">
                        <button
                            onClick={handleTestConnection}
                            disabled={isTestingConnection}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {isTestingConnection ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Testing...</span>
                                </>
                            ) : (
                                <>
                                    <span>🔄</span>
                                    <span>Test Connection</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleSaveConfiguration}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center space-x-2"
                        >
                            <span>💾</span>
                            <span>Save & Apply</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
                    <strong>💡 Tips:</strong>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                        <li>Default backend runs on port 3000</li>
                        <li>For local development, use localhost or 127.0.0.1</li>
                        <li>For network access, use your computer's IP address</li>
                        <li>Make sure CORS is configured on your backend</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BackendConfigModal; 