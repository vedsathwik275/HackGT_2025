import React from 'react';

const StatsPanel = ({ statistics, fieldDimensions, lineOfScrimmage }) => {
    const getTeamBalanceColor = (balance) => {
        switch (balance) {
            case 'balanced':
                return 'text-green-600';
            case 'unbalanced':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Detection Statistics</h2>
            
            {/* Basic Detection Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{statistics.playerCount}</div>
                    <div className="text-sm text-gray-600">Players</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{statistics.refCount}</div>
                    <div className="text-sm text-gray-600">Referees</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{statistics.totalCount}</div>
                    <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{statistics.avgConfidence}%</div>
                    <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
            </div>

            {/* Team Statistics */}
            {statistics.offenseCount > 0 || statistics.defenseCount > 0 ? (
                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🏈 Team Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{statistics.offenseCount}</div>
                            <div className="text-sm text-gray-600">Offense</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <div className="text-xl font-bold text-red-600">{statistics.defenseCount}</div>
                            <div className="text-sm text-gray-600">Defense</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className={`text-xl font-bold ${getTeamBalanceColor(statistics.teamBalance)}`}>
                                {statistics.teamBalance.charAt(0).toUpperCase() + statistics.teamBalance.slice(1)}
                            </div>
                            <div className="text-sm text-gray-600">Team Balance</div>
                        </div>
                    </div>
                </div>
            ) : null}

        </div>
    );
};

export default StatsPanel; 