export class DataManager {
    constructor(nflField) {
        this.nflField = nflField;
        this.detections = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for new detections
        window.addEventListener('detectionsReceived', (e) => {
            this.processDetections(e.detail.data.predictions || []);
        });

        // Listen for marker clicks from field
        window.addEventListener('markerClicked', (e) => {
            this.highlightDetectionInTable(e.detail.index);
        });
    }

    processDetections(detections) {
        this.detections = detections;
        this.updateStatistics();
        this.updateDetectionTable();
    }

    updateStatistics() {
        const players = this.detections.filter(d => d.class === 'player');
        const refs = this.detections.filter(d => d.class === 'ref');
        const totalConfidence = this.detections.reduce((sum, d) => sum + d.confidence, 0);
        const avgConfidence = this.detections.length > 0 ? (totalConfidence / this.detections.length) : 0;

        // Update stat cards
        document.getElementById('playerCount').textContent = players.length;
        document.getElementById('refCount').textContent = refs.length;
        document.getElementById('totalCount').textContent = this.detections.length;
        document.getElementById('avgConfidence').textContent = Math.round(avgConfidence * 100) + '%';
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
        
        row.innerHTML = `
            <td class="px-4 py-2 text-sm font-mono">${this.truncateId(detection.detection_id)}</td>
            <td class="px-4 py-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    this.getClassBadgeStyles(detection.class)
                }">
                    ${this.capitalize(detection.class)}
                </span>
            </td>
            <td class="px-4 py-2 text-sm">(${Math.round(detection.x)}, ${Math.round(detection.y)})</td>
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

    getConfidenceBarColor(confidence) {
        if (confidence >= 0.8) return 'bg-green-500';
        if (confidence >= 0.7) return 'bg-yellow-500';
        return 'bg-red-500';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
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
        this.updateStatistics();
        this.updateDetectionTable();
    }

    exportData() {
        return {
            detections: this.detections,
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
}