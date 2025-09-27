export class NFLField {
    constructor() {
        this.fieldWidth = 1000;
        this.fieldHeight = 533;
        this.detections = [];
        this.imageDimensions = { width: 1280, height: 600 };
        
        this.initializeField();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for image dimensions changes
        window.addEventListener('imageDimensionsChanged', (e) => {
            this.imageDimensions = e.detail;
        });

        // Listen for new detections
        window.addEventListener('detectionsReceived', (e) => {
            this.imageDimensions = e.detail.imageDimensions;
            this.processDetections(e.detail.data.predictions || []);
        });
    }

    initializeField() {
        this.drawYardLines();
        this.drawHashMarks();
        this.drawFieldNumbers();
    }

    drawYardLines() {
        const yardLinesGroup = document.getElementById('yardLines');
        yardLinesGroup.innerHTML = ''; // Clear existing lines
        
        const fieldWidth = this.fieldWidth;
        const endZoneWidth = fieldWidth / 12;
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

        // Draw goal lines (thicker)
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
        hashMarksGroup.innerHTML = ''; // Clear existing hash marks
        
        const fieldWidth = this.fieldWidth;
        const fieldHeight = this.fieldHeight;
        const endZoneWidth = fieldWidth / 12;
        const playingFieldWidth = fieldWidth - (2 * endZoneWidth);
        
        // NFL hash marks are at specific positions
        const hashY1 = fieldHeight * 0.3;
        const hashY2 = fieldHeight * 0.7;
        
        // Draw hash marks every 5 yards (excluding goal lines)
        for (let i = 1; i < 20; i++) {
            const x = endZoneWidth + (i * playingFieldWidth / 20);
            
            // Top hash marks
            const hash1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hash1.setAttribute('x1', x);
            hash1.setAttribute('y1', hashY1 - 10);
            hash1.setAttribute('x2', x);
            hash1.setAttribute('y2', hashY1 + 10);
            hash1.setAttribute('class', 'hash-mark');
            hashMarksGroup.appendChild(hash1);
            
            // Bottom hash marks
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
        numbersGroup.innerHTML = ''; // Clear existing numbers
        
        const fieldWidth = this.fieldWidth;
        const fieldHeight = this.fieldHeight;
        const endZoneWidth = fieldWidth / 12;
        const playingFieldWidth = fieldWidth - (2 * endZoneWidth);
        
        // Yard numbers: 10, 20, 30, 40, 50, 40, 30, 20, 10
        const yardNumbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];
        
        yardNumbers.forEach((number, index) => {
            const x = endZoneWidth + ((index + 1) * 2 * playingFieldWidth / 20);
            
            // Top numbers
            const topText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            topText.setAttribute('x', x);
            topText.setAttribute('y', fieldHeight * 0.25);
            topText.setAttribute('class', 'field-numbers');
            topText.textContent = number;
            numbersGroup.appendChild(topText);
            
            // Bottom numbers (rotated)
            const bottomText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            bottomText.setAttribute('x', x);
            bottomText.setAttribute('y', fieldHeight * 0.75);
            bottomText.setAttribute('class', 'field-numbers');
            bottomText.setAttribute('transform', `rotate(180 ${x} ${fieldHeight * 0.75})`);
            bottomText.textContent = number;
            numbersGroup.appendChild(bottomText);
        });
    }

    processDetections(detections) {
        this.detections = detections;
        this.renderDetections();
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
        const fieldX = (x / this.imageDimensions.width) * this.fieldWidth;
        const fieldY = (y / this.imageDimensions.height) * this.fieldHeight;
        
        return { x: fieldX, y: fieldY };
    }

    createDetectionMarker(detection, position, index) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'field-marker');
        group.setAttribute('data-detection-id', detection.detection_id);
        group.setAttribute('data-index', index);

        // Determine marker color
        let color = '#3b82f6'; // Blue for players
        if (detection.class === 'ref') {
            color = '#eab308'; // Yellow for referees
        }
        if (detection.confidence < 0.7) {
            color = '#ef4444'; // Red for low confidence
        }

        // Calculate marker size based on confidence
        const radius = Math.max(4, Math.min(12, detection.confidence * 15));

        // Create circle marker
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', position.x);
        circle.setAttribute('cy', position.y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('opacity', '0.8');

        // Create confidence text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', position.x);
        text.setAttribute('y', position.y - radius - 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.textContent = Math.round(detection.confidence * 100) + '%';

        // Create tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${detection.class.toUpperCase()} - ${Math.round(detection.confidence * 100)}% confidence\nPosition: (${Math.round(detection.x)}, ${Math.round(detection.y)})\nID: ${detection.detection_id.substring(0, 8)}...`;

        group.appendChild(circle);
        group.appendChild(text);
        group.appendChild(title);

        // Add click event for highlighting in table
        group.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('markerClicked', {
                detail: { index, detection }
            }));
        });

        return group;
    }

    highlightDetectionOnField(index) {
        // Reset all markers to default style
        document.querySelectorAll('.field-marker circle').forEach(circle => {
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('opacity', '0.8');
        });

        // Highlight the selected marker
        const markers = document.querySelectorAll('.field-marker');
        if (markers[index]) {
            const circle = markers[index].querySelector('circle');
            circle.setAttribute('stroke-width', '4');
            circle.setAttribute('opacity', '1');
        }
    }

    clearDetections() {
        this.detections = [];
        const markersGroup = document.getElementById('detectionMarkers');
        markersGroup.innerHTML = '';
    }

    getFieldYardage(x) {
        const fieldPercent = x / this.imageDimensions.width;
        const yardLine = Math.round(fieldPercent * 120);
        
        if (yardLine <= 10) return `${10 - yardLine} yard line (End Zone)`;
        if (yardLine >= 110) return `${yardLine - 110} yard line (End Zone)`;
        
        const adjustedYard = yardLine - 10;
        if (adjustedYard <= 50) return `${adjustedYard} yard line`;
        return `${100 - adjustedYard} yard line`;
    }

    getDetections() {
        return this.detections;
    }
}