import React from 'react';

const ProcessingStatus = ({ isProcessing, message }) => {
    if (!isProcessing) return null;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="loading-spinner"></div>
                <div>
                    <h3 className="font-semibold text-blue-800">Processing Image...</h3>
                    <p className="text-sm text-blue-600">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default ProcessingStatus; 