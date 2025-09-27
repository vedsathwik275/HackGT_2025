import React from 'react';

const PlayerInfoPanel = ({ detection, mappedPlayer, onClose }) => {
    if (!detection) return null;

    // Position name mappings for better display
    const positionNames = {
        'QB': 'Quarterback',
        'RB': 'Running Back',
        'FB': 'Fullback',
        'WR': 'Wide Receiver',
        'TE': 'Tight End',
        'C': 'Center',
        'OG': 'Offensive Guard',
        'OT': 'Offensive Tackle',
        'DE': 'Defensive End',
        'DT': 'Defensive Tackle',
        'NT': 'Nose Tackle',
        'LB': 'Linebacker',
        'MLB': 'Middle Linebacker',
        'OLB': 'Outside Linebacker',
        'CB': 'Cornerback',
        'DB': 'Defensive Back',
        'S': 'Safety',
        'FS': 'Free Safety',
        'SS': 'Strong Safety',
        'K': 'Kicker',
        'P': 'Punter',
        'LS': 'Long Snapper',
        'KR': 'Kick Returner',
        'PR': 'Punt Returner',
        'ref': 'Referee'
    };

    const positionName = positionNames[detection.class] || detection.class;
    const isRef = detection.class === 'ref';

    return (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl p-4 min-w-64 max-w-sm border-2 border-gray-200 z-50">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800">Player Information</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
            
            <div className="space-y-3">
                {/* Position */}
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Position:</span>
                    <span className="font-bold text-gray-800">
                        {detection.class} - {positionName}
                    </span>
                </div>

                {/* Team (if not referee) */}
                {!isRef && mappedPlayer && (
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Team:</span>
                        <span className={`font-bold capitalize ${
                            mappedPlayer.team === 'offense' ? 'text-green-600' :
                            mappedPlayer.team === 'defense' ? 'text-red-600' :
                            mappedPlayer.team === 'special' ? 'text-orange-600' :
                            'text-blue-600'
                        }`}>
                            {mappedPlayer.team}
                        </span>
                    </div>
                )}

                {/* Confidence */}
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Confidence:</span>
                    <span className="font-bold text-gray-800">
                        {Math.round(detection.confidence * 100)}%
                    </span>
                </div>

                {/* Field Position */}
                {mappedPlayer && mappedPlayer.coordinates && (
                    <div className="border-t pt-3 mt-3">
                        <h4 className="font-semibold text-gray-700 mb-2">Field Position:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600">X (LOS):</span>
                                <span className="ml-1 font-mono">
                                    {mappedPlayer.coordinates.xYards?.toFixed(1) || 'N/A'} yds
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Y (Width):</span>
                                <span className="ml-1 font-mono">
                                    {mappedPlayer.coordinates.yYards?.toFixed(1) || 'N/A'} yds
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pixel Coordinates */}
                <div className="border-t pt-3 mt-3">
                    <h4 className="font-semibold text-gray-700 mb-2">Image Position:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-gray-600">X:</span>
                            <span className="ml-1 font-mono">{detection.x.toFixed(0)}px</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Y:</span>
                            <span className="ml-1 font-mono">{detection.y.toFixed(0)}px</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                        <div>
                            <span className="text-gray-600">Width:</span>
                            <span className="ml-1 font-mono">{detection.width}px</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Height:</span>
                            <span className="ml-1 font-mono">{detection.height}px</span>
                        </div>
                    </div>
                </div>

                {/* Detection ID */}
                <div className="border-t pt-3 mt-3">
                    <div className="text-xs text-gray-500">
                        <span className="font-medium">ID:</span>
                        <span className="ml-1 font-mono break-all">
                            {detection.detection_id}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerInfoPanel;
