// NFL Field Detection Mapper
class NFLFieldMapper {
    constructor() {
        this.fieldWidth = 1000; // SVG width
        this.fieldHeight = 533; // SVG height (maintains NFL field ratio)
        this.detections = [];
        this.originalImageDimensions = { width: 1280, height: 600 }; // Default, will be updated
        
        this.initializeField();
        this.setupEventListeners();
    }

    initializeField() {
        this.drawYardLines();
        this.drawHashMarks();
        this.drawFieldNumbers();
    }

    drawYardLines() {
        const yardLinesGroup = document.getElementById('yardLines');
        const fieldWidth = this.fieldWidth;
        const endZoneWidth = fieldWidth / 12; // 10 yards each end zone
        const playingFieldWidth = fieldWidth - (2 * endZoneWidth);
        
        // Draw yard lines every 5 yards
        for (let i = 0; i <= 20; i++) {
            const x = endZoneWidth + (i * playingFieldWidth / 20);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', this.fieldHeight);
            line.setAttribute('class', 'yard-line');
            yardLinesGroup.appendChild(line);
        }

        // Goal lines (thicker)
        [endZoneWidth, fieldWidth - endZoneWidth].forEach(x => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', this.fieldHeight);
            line.setAttribute('stroke', 'white');
            line.setAttribute('stroke-width', '4');
            yardLinesGroup.appendChild(line);
        });
    }

    drawHashMarks() {
        const hashMarksGroup = document.getElementById('hashMarks');
        const fieldWidth = this.fieldWidth;
        const fieldHeight = this.fieldHeight;
        const endZoneWidth = fieldWidth / 12;
        const playingFieldWidth = fieldWidth - (2 * endZoneWidth);
        
        // Hash mark positions (NFL hash marks are 18.5 feet from center)
        const hashY1 = fieldHeight * 0.3;
        const hashY2 = fieldHeight * 0.7;
        
        for (let i = 1; i < 20; i++) {
            const x = endZoneWidth + (i * playingFieldWidth / 20);
            
            // Left hash marks
            const hash1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hash1.setAttribute('x1', x);
            hash1.setAttribute('y1', hashY1 - 10);
            hash1.setAttribute('x2', x);
            hash1.setAttribute('y2', hashY1 + 10);
            hash1.setAttribute('class', 'hash-mark');
            hashMarksGroup.appendChild(hash1);
            
            // Right hash marks
            const hash2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hash2.setAttribute('x1', x);
            hash2.setAttribute('y1', hashY2 - 10);
            hash2.setAttribute('x2', x);
            hash2.setAttribute('y2', hashY2 + 10);
            hash2.setAttribute('class', 'hash-mark');
            hashMarksGroup.appendChild(hash2);
        }
    }

    drawFieldNumbers() {
        const numbersGroup = document.getElementById('fieldNumbers');
        const fieldWidth = this.fieldWidth;
        const fieldHeight = this.fieldHeight;
        const endZoneWidth = fieldWidth / 12;
        const playingFieldWidth = fieldWidth - (2 * endZoneWidth);
        
        // Yard numbers (every 10 yards)
        const yardNumbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];
        
        yardNumbers.forEach((number, index) => {
            const x = endZoneWidth + ((index + 1) * 2 * playingFieldWidth / 20);
            
            // Top number
            const topText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            topText.setAttribute('x', x);
            topText.setAttribute('y', fieldHeight * 0.25);
            topText.setAttribute('class', 'field-numbers');
            topText.textContent = number;
            numbersGroup.appendChild(topText);
            
            // Bottom number (upside down)
            const bottomText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            bottomText.setAttribute('x', x);
            bottomText.setAttribute('y', fieldHeight * 0.75);
            bottomText.setAttribute('class', 'field-numbers');
            bottomText.setAttribute('transform', `rotate(180 ${x} ${fieldHeight * 0.75})`);
            bottomText.textContent = number;
            numbersGroup.appendChild(bottomText);
        });
    }

    setupEventListeners() {
        document.getElementById('jsonFile').addEventListener('change', (e) => {
            this.loadJsonFile(e.target.files[0]);
        });

        document.getElementById('loadSample').addEventListener('click', () => {
            this.loadSampleData();
        });

        document.getElementById('clearField').addEventListener('click', () => {
            this.clearDetections();
        });
    }

    loadJsonFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.processDetections(data);
            } catch (error) {
                alert('Error parsing JSON file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    loadSampleData() {
        // Sample data from the user's example
        const sampleData = {
            "predictions": [
                {"x": 756.5, "y": 550, "width": 61, "height": 100, "confidence": 0.92, "class": "player", "class_id": 0, "detection_id": "a03d99a8-2c4a-4080-84bd-1190b511088b"},
                {"x": 548, "y": 232.5, "width": 76, "height": 77, "confidence": 0.918, "class": "player", "class_id": 0, "detection_id": "711a3324-5fa7-4026-9ea7-3d01c1ee7694"},
                {"x": 546.5, "y": 96.5, "width": 65, "height": 79, "confidence": 0.916, "class": "player", "class_id": 0, "detection_id": "a26a87d0-51d7-4a7d-8fdd-58489c4002cc"},
                {"x": 561, "y": 408, "width": 74, "height": 104, "confidence": 0.913, "class": "player", "class_id": 0, "detection_id": "8069ac76-7a4b-421e-8853-b10af6d0cbb6"},
                {"x": 575, "y": 314.5, "width": 86, "height": 81, "confidence": 0.912, "class": "player", "class_id": 0, "detection_id": "3d7fcade-14f3-4fc0-abcc-563641b72618"},
                {"x": 986, "y": 217, "width": 50, "height": 98, "confidence": 0.909, "class": "player", "class_id": 0, "detection_id": "d248b7c8-a331-4b90-abd2-4ae8d9134ed7"},
                {"x": 640.5, "y": 291, "width": 71, "height": 98, "confidence": 0.908, "class": "player", "class_id": 0, "detection_id": "a604e466-716f-4d02-acd1-be0ee9c543ad"},
                {"x": 1245.5, "y": 365, "width": 53, "height": 102, "confidence": 0.908, "class": "player", "class_id": 0, "detection_id": "f3a23aaa-33fe-4fa0-a6f6-114724568237"},
                {"x": 1021.5, "y": 397, "width": 33, "height": 126, "confidence": 0.873, "class": "ref", "class_id": 1, "detection_id": "0eecc7c0-73f5-4187-9bd7-c56de9e2a492"},
                {"x": 683, "y": 29, "width": 36, "height": 58, "confidence": 0.532, "class": "ref", "class_id": 1, "detection_id": "c9fe098b-206f-40d2-846b-8755f3b4bd3a"}
            ]
        };
        
        // Assume original image dimensions based on max coordinates
        this.originalImageDimensions = { width: 1280, height: 600 };
        this.processDetections(sampleData);
    }

    processDetections(data) {
        this.detections = data.predictions || [];
        this.updateStatistics();
        this.renderDetections();
        this.updateDetectionTable();
    }

    updateStatistics() {
        const players = this.detections.filter(d => d.class === 'player');
        const refs = this.detections.filter(d => d.class === 'ref');
        const totalConfidence = this.detections.reduce((sum, d) => sum + d.confidence, 0);
        const avgConfidence = this.detections.length > 0 ? (totalConfidence / this.detections.length) : 0;

        document.getElementById('playerCount').textContent = players.length;
        document.getElementById('refCount').textContent = refs.length;
        document.getElementById('totalCount').textContent = this.detections.length;
        document.getElementById('avgConfidence').textContent = Math.round(avgConfidence * 100) + '%';
    }

    renderDetections() {
        const markersGroup = document.getElementById('detectionMarkers');
        markersGroup.innerHTML = ''; // Clear existing markers

        this.detections.forEach((detection, index) => {
            const fieldPos = this.mapToFieldPosition(detection.x, detection.y);
            const marker = this.createDetectionMarker(detection, fieldPos, index);
            markersGroup.appendChild(marker);
        });
    }

    mapToFieldPosition(x, y) {
        // Map from original image coordinates to field SVG coordinates
        const fieldX = (x / this.originalImageDimensions.width) * this.fieldWidth;
        const fieldY = (y / this.originalImageDimensions.height) * this.fieldHeight;
        
        return { x: fieldX, y: fieldY };
    }

    createDetectionMarker(detection, position, index) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'field-marker');
        group.setAttribute('data-detection-id', detection.detection_id);

        // Determine marker color and size based on class and confidence
        let color = '#3b82f6'; // Blue for players
        if (detection.class === 'ref') {
            color = '#eab308'; // Yellow for refs
        }
        if (detection.confidence < 0.7) {
            color = '#ef4444'; // Red for low confidence
        }

        const radius = Math.max(4, Math.min(12, detection.confidence * 15));

        // Main marker circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', position.x);
        circle.setAttribute('cy', position.y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('opacity', '0.8');

        // Confidence text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', position.x);
        text.setAttribute('y', position.y - radius - 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.textContent = Math.round(detection.confidence * 100) + '%';

        // Tooltip on hover
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${detection.class.toUpperCase()} - ${Math.round(detection.confidence * 100)}% confidence\nPosition: (${Math.round(detection.x)}, ${Math.round(detection.y)})\nID: ${detection.detection_id.substring(0, 8)}...`;

        group.appendChild(circle);
        group.appendChild(text);
        group.appendChild(title);

        // Click event to highlight in table
        group.addEventListener('click', () => {
            this.highlightDetectionInTable(index);
        });

        return group;
    }

    highlightDetectionInTable(index) {
        // Remove previous highlights
        document.querySelectorAll('#detectionTable tr').forEach(row => {
            row.classList.remove('bg-blue-100');
        });

        // Highlight selected row
        const row = document.querySelector(`#detectionTable tr[data-index="${index}"]`);
        if (row) {
            row.classList.add('bg-blue-100');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    updateDetectionTable() {
        const tableBody = document.getElementById('detectionTable');
        tableBody.innerHTML = '';

        this.detections.forEach((detection, index) => {
            const row = document.createElement('tr');
            row.setAttribute('data-index', index);
            row.className = 'hover:bg-gray-50 cursor-pointer';
            
            const fieldPos = this.getFieldYardage(detection.x);
            
            row.innerHTML = `
                <td class="px-4 py-2 text-sm">${detection.detection_id.substring(0, 8)}...</td>
                <td class="px-4 py-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        detection.class === 'player' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }">
                        ${detection.class}
                    </span>
                </td>
                <td class="px-4 py-2 text-sm">(${Math.round(detection.x)}, ${Math.round(detection.y)})</td>
                <td class="px-4 py-2 text-sm">${detection.width}×${detection.height}</td>
                <td class="px-4 py-2">
                    <div class="flex items-center">
                        <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: ${detection.confidence * 100}%"></div>
                        </div>
                        <span class="text-sm font-medium">${Math.round(detection.confidence * 100)}%</span>
                    </div>
                </td>
                <td class="px-4 py-2 text-sm">${fieldPos}</td>
            `;

            row.addEventListener('click', () => {
                this.highlightDetectionOnField(index);
            });

            tableBody.appendChild(row);
        });
    }

    getFieldYardage(x) {
        // Convert x coordinate to yard line
        const fieldPercent = x / this.originalImageDimensions.width;
        const yardLine = Math.round(fieldPercent * 120);
        
        if (yardLine <= 10) return `${10 - yardLine} yard line (End Zone)`;
        if (yardLine >= 110) return `${yardLine - 110} yard line (End Zone)`;
        
        const adjustedYard = yardLine - 10;
        if (adjustedYard <= 50) return `${adjustedYard} yard line`;
        return `${100 - adjustedYard} yard line`;
    }

    highlightDetectionOnField(index) {
        // Remove previous highlights
        document.querySelectorAll('.field-marker circle').forEach(circle => {
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('opacity', '0.8');
        });

        // Highlight selected marker
        const markers = document.querySelectorAll('.field-marker');
        if (markers[index]) {
            const circle = markers[index].querySelector('circle');
            circle.setAttribute('stroke-width', '4');
            circle.setAttribute('opacity', '1');
        }
    }

    clearDetections() {
        this.detections = [];
        document.getElementById('detectionMarkers').innerHTML = '';
        document.getElementById('detectionTable').innerHTML = '';
        this.updateStatistics();
        
        // Reset file input
        document.getElementById('jsonFile').value = '';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NFLFieldMapper();
});