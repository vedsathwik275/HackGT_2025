import React from 'react';

const Header = () => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
                🏈 NFL Field Detection Mapper
            </h1>
            <p className="text-gray-600 mb-4">
                Upload an image to automatically detect players and referees, then visualize them on an NFL field with accurate coordinate mapping.
            </p>
        </div>
    );
};

export default Header; 