export class DataManager {
    constructor(nflField) {
        this.nflField = nflField;
        this.detections = [];
        this.mappedData = null;
        this.lineOfScrimmage = null;
        this.fieldDimensions = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for new detections with mapped coordinates
        window.addEventListener('detectionsReceived', (e) => {
            this.processDetections(
                e.detail.data.predictions || [],
                e.detail.mappedData || null,
                e.detail.lineOfScrimmage || null,
                e.detail.fieldDimensions || null
            );
        });

        // Listen for marker clicks from field
        window.addEventListener('markerClicked', (e) => {
            this.highlightDetectionInTable(e.detail.index);
        });
    }

    processDetections(detections, mappedData = null, lineOfScrimmage = null, fieldDimensions = null) {
        this.detections = detections;
        this.mappedData = mappedData;
        this.lineOfScrimmage = lineOfScrimmage;
        this.fieldDimensions = fieldDimensions;
        
        this.updateStatistics();
        this.updateDetectionTable();
        this.updateFieldInfo();
    }

    updateStatistics() {
        const players = this.detections.filter(d => d.class === 'player');
        const refs = this.detections.filter(d => d.class === 'ref');
        const totalConfidence = this.detections.reduce((sum, d) => sum + d.confidence, 0);
        const avgConfidence = this.detections.length > 0 ? (totalConfidence / this.detections.length) : 0;

        // Update basic stat cards
        document.getElementById('playerCount').textContent = players.length;
        document.getElementById('refCount').textContent = refs.length;
        document.getElementById('totalCount').textContent = this.detections.length;
        document.getElementById('avgConfidence').textContent = Math.round(avgConfidence * 100) + '%';

        // Update team statistics if mapped data is available
        if (this.mappedData && this.mappedData.teamStats) {
            const teamStats = this.mappedData.teamStats;
            
            // Update offense/defense counts
            const offenseElement = document.getElementById('offenseCount');
            const defenseElement = document.getElementById('defenseCount');
            const balanceElement = document.getElementById('teamBalance');
            
            if (offenseElement) offenseElement.textContent = teamStats.offenseCount;
            if (defenseElement) defenseElement.textContent = teamStats.defenseCount;
            if (balanceElement) {
                balanceElement.textContent = teamStats.teamBalance;
                balanceElement.className = teamStats.teamBalance === 'balanced' 
                    ? 'text-green-600 font-medium' 
                    : 'text-yellow-600 font-medium';
            }
        }
    }

    updateDetectionTable() {
        const tableBody = document.getElementById('detectionTable');
        tableBody.innerHTML = '';

        this.detections.forEach((detection, index) => {
            const row = this.createTableRow(detection, index);
            tableBody.appendChild(row);
        });
    }

    createTableRow(detection, index) {
        const row = document.createElement('tr');
        row.setAttribute('data-index', index);
        row.className = 'hover:bg-gray-50 cursor-pointer transition-colors';
        
        const fieldPos = this.nflField.getFieldYardage(detection.x);
        const confidencePercent = Math.round(detection.confidence * 100);
        
        // Find mapped data for this detection
        let mappedPlayer = null;
        let teamInfo = '';
        let fieldCoords = '';
        
        if (this.mappedData && detection.class === 'player') {
            mappedPlayer = this.mappedData.players.find(p => p.detectionId === detection.detection_id);
            if (mappedPlayer) {
                teamInfo = `
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        this.getTeamBadgeStyles(mappedPlayer.team)
                    }">
                        ${this.capitalize(mappedPlayer.team)}
                    </span>
                `;
                fieldCoords = `(${mappedPlayer.coordinates.xYards}, ${mappedPlayer.coordinates.yYards}) yd`;
            }
        } else if (this.mappedData && detection.class === 'ref') {
            const mappedRef = this.mappedData.referees.find(r => r.detectionId === detection.detection_id);
            if (mappedRef) {
                fieldCoords = `(${mappedRef.coordinates.xYards}, ${mappedRef.coordinates.yYards}) yd`;
            }
        }
        
        row.innerHTML = `
            <td class="px-4 py-2 text-sm font-mono">${this.truncateId(detection.detection_id)}</td>
            <td class="px-4 py-2">
                <div class="space-y-1">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        this.getClassBadgeStyles(detection.class)
                    }">
                        ${this.capitalize(detection.class)}
                    </span>
                    ${teamInfo}
                </div>
            </td>
            <td class="px-4 py-2 text-sm">
                <div class="space-y-1">
                    <div>Pixels: (${Math.round(detection.x)}, ${Math.round(detection.y)})</div>
                    ${fieldCoords ? `<div class="text-blue-600 font-medium">Field: ${fieldCoords}</div>` : ''}
                </div>
            </td>
            <td class="px-4 py-2 text-sm">${detection.width}×${detection.height}</td>
            <td class="px-4 py-2">
                <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="${this.getConfidenceBarColor(detection.confidence)} h-2 rounded-full" 
                             style="width: ${confidencePercent}%"></div>
                    </div>
                    <span class="text-sm font-medium">${confidencePercent}%</span>
                </div>
            </td>
            <td class="px-4 py-2 text-sm">${fieldPos}</td>
        `;

        // Add click event to highlight on field
        row.addEventListener('click', () => {
            this.highlightDetectionInTable(index);
            this.nflField.highlightDetectionOnField(index);
        });

        return row;
    }

    truncateId(id) {
        return id.substring(0, 8) + '...';
    }

    getClassBadgeStyles(className) {
        return className === 'player' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-yellow-100 text-yellow-800';
    }

    getTeamBadgeStyles(team) {
        return team === 'offense' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800';
    }

    getConfidenceBarColor(confidence) {
        if (confidence >= 0.8) return 'bg-green-500';
        if (confidence >= 0.7) return 'bg-yellow-500';
        return 'bg-red-500';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    updateFieldInfo() {
        if (!this.fieldDimensions) return;

        // Update field dimension displays if elements exist
        const fieldWidthElement = document.getElementById('fieldWidth');
        const fieldLengthElement = document.getElementById('fieldLength');
        const pixelsPerYardElement = document.getElementById('pixelsPerYard');
        const losElement = document.getElementById('lineOfScrimmage');

        if (fieldWidthElement) {
            fieldWidthElement.textContent = `${this.fieldDimensions.widthYards.toFixed(1)} yards`;
        }
        if (fieldLengthElement) {
            fieldLengthElement.textContent = `${this.fieldDimensions.lengthYards.toFixed(1)} yards`;
        }
        if (pixelsPerYardElement) {
            pixelsPerYardElement.textContent = `${this.fieldDimensions.pixelsPerYard.toFixed(1)} px/yd`;
        }
        if (losElement && this.lineOfScrimmage) {
            losElement.textContent = `x = ${this.lineOfScrimmage.toFixed(1)}`;
        }
    }

    highlightDetectionInTable(index) {
        // Remove existing highlights
        document.querySelectorAll('#detectionTable tr').forEach(row => {
            row.classList.remove('bg-blue-100');
        });

        // Highlight the selected row
        const row = document.querySelector(`#detectionTable tr[data-index="${index}"]`);
        if (row) {
            row.classList.add('bg-blue-100');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    getStatistics() {
        if (this.detections.length === 0) {
            return {
                players: 0,
                refs: 0,
                total: 0,
                avgConfidence: 0
            };
        }

        const players = this.detections.filter(d => d.class === 'player');
        const refs = this.detections.filter(d => d.class === 'ref');
        const totalConfidence = this.detections.reduce((sum, d) => sum + d.confidence, 0);
        const avgConfidence = totalConfidence / this.detections.length;

        return {
            players: players.length,
            refs: refs.length,
            total: this.detections.length,
            avgConfidence: Math.round(avgConfidence * 100)
        };
    }

    clearAll() {
        this.detections = [];
        this.mappedData = null;
        this.lineOfScrimmage = null;
        this.fieldDimensions = null;
        this.updateStatistics();
        this.updateDetectionTable();
        this.updateFieldInfo();
    }

    exportData() {
        return {
            detections: this.detections,
            mappedData: this.mappedData,
            fieldDimensions: this.fieldDimensions,
            lineOfScrimmage: this.lineOfScrimmage,
            statistics: this.getStatistics(),
            timestamp: new Date().toISOString()
        };
    }

    getDetectionById(id) {
        return this.detections.find(d => d.detection_id === id);
    }

    filterDetections(filterFn) {
        return this.detections.filter(filterFn);
    }

    sortDetections(sortFn) {
        return [...this.detections].sort(sortFn);
    }

    // New methods for working with mapped coordinate data
    getMappedPlayersByTeam(team) {
        if (!this.mappedData) return [];
        return this.mappedData.players.filter(p => p.team === team);
    }

    getOffensivePlayers() {
        return this.getMappedPlayersByTeam('offense');
    }

    getDefensivePlayers() {
        return this.getMappedPlayersByTeam('defense');
    }

    getFieldDimensions() {
        return this.fieldDimensions;
    }

    getLineOfScrimmage() {
        return this.lineOfScrimmage;
    }

    getMappedData() {
        return this.mappedData;
    }

    // Get player by distance from line of scrimmage
    getPlayersByDistanceFromLOS() {
        if (!this.mappedData) return [];
        return [...this.mappedData.players].sort((a, b) => 
            Math.abs(a.coordinates.xYards) - Math.abs(b.coordinates.xYards)
        );
    }

    // Get players by distance from sideline
    getPlayersByDistanceFromSideline() {
        if (!this.mappedData) return [];
        return [...this.mappedData.players].sort((a, b) => 
            Math.abs(a.coordinates.yYards) - Math.abs(b.coordinates.yYards)
        );
    }
}