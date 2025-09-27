import React, { useState, useCallback } from 'react';

const ImageUpload = ({ imageProcessor, onClearAll, isProcessingDetection }) => {
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        imageProcessor.handleImageUpload(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target.result);
        };
        reader.readAsDataURL(file);
        setError('');
    }, [imageProcessor]);

    const handleJSONChange = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await imageProcessor.loadJsonFile(file);
            setError('');
        } catch (err) {
            setError(`Error loading JSON: ${err.message}`);
        }
    }, [imageProcessor]);

    const handleDetectPlayers = useCallback(async () => {
        try {
            await imageProcessor.detectPlayersInImage();
            setError('');
        } catch (err) {
            setError(`Detection failed: ${err.message}`);
        }
    }, [imageProcessor]);

    const handleLoadSample = useCallback(async () => {
        try {
            await imageProcessor.loadSampleData();
            setImagePreview(null); // No preview for sample data
            setError('');
        } catch (err) {
            setError(`Error loading sample data: ${err.message}`);
        }
    }, [imageProcessor]);

    const handleClearAll = useCallback(() => {
        onClearAll();
        setImagePreview(null);
        setError('');
    }, [onClearAll]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🖼️ Image Upload & Detection
            </h2>
            
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                        <div className="text-red-800">
                            <strong>Error:</strong> {error}
                        </div>
                        <button
                            onClick={() => setError('')}
                            className="ml-auto text-red-600 hover:text-red-800"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
                {/* Upload Controls */}
                <div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Football Image
                        </label>
                        <input
                            ref={imageProcessor.fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleDetectPlayers}
                            disabled={!imageProcessor.currentImage || imageProcessor.isProcessing}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            {imageProcessor.isProcessing ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>🔍</span>
                                    <span>Detect Players</span>
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={handleLoadSample}
                            disabled={imageProcessor.isProcessing || isProcessingDetection}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            📂 Load Sample Data
                        </button>
                        
                        <button
                            onClick={imageProcessor.triggerJsonInput}
                            disabled={imageProcessor.isProcessing || isProcessingDetection}
                            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            📄 Load JSON File
                        </button>
                        
                        <button
                            onClick={handleClearAll}
                            disabled={imageProcessor.isProcessing || isProcessingDetection}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            🗑️ Clear All
                        </button>
                    </div>

                    <input
                        ref={imageProcessor.jsonInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleJSONChange}
                        className="hidden"
                    />
                </div>

                {/* Image Preview */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Preview
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center min-h-[200px] flex items-center justify-center">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Football field preview"
                                className="image-preview"
                            />
                        ) : (
                            <div className="text-gray-500">
                                <svg className="mx-auto h-12 w-12 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <p>No image selected</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageUpload; 