import matplotlib.pyplot as plt
import matplotlib.patches as patches
import json

# Detection data
data = {
  "predictions": [
    {
      "x": 351.5,
      "y": 241,
      "width": 61,
      "height": 68,
      "confidence": 0.927,
      "class": "player",
      "class_id": 0,
      "detection_id": "0b7f9539-f4f1-4872-ad08-42d21355bba9"
    },
    {
      "x": 380,
      "y": 469,
      "width": 80,
      "height": 102,
      "confidence": 0.917,
      "class": "player",
      "class_id": 0,
      "detection_id": "7c5e5c3a-f56e-4e6f-9ebc-1d3a448e4a83"
    },
    {
      "x": 473,
      "y": 185,
      "width": 48,
      "height": 74,
      "confidence": 0.915,
      "class": "player",
      "class_id": 0,
      "detection_id": "be6372b0-b7bb-42f9-ac20-6a042db321cb"
    },
    {
      "x": 528.5,
      "y": 281,
      "width": 61,
      "height": 52,
      "confidence": 0.907,
      "class": "player",
      "class_id": 0,
      "detection_id": "5ef24bef-3fb5-46e6-a91a-9deea896f10a"
    },
    {
      "x": 532,
      "y": 473.5,
      "width": 54,
      "height": 95,
      "confidence": 0.904,
      "class": "player",
      "class_id": 0,
      "detection_id": "340e07c6-5787-42f6-832a-51836d5e24e4"
    },
    {
      "x": 632.5,
      "y": 238.5,
      "width": 35,
      "height": 81,
      "confidence": 0.904,
      "class": "player",
      "class_id": 0,
      "detection_id": "84ce3940-4735-4a63-ad0c-3f36815a72d6"
    },
    {
      "x": 414.5,
      "y": 122.5,
      "width": 47,
      "height": 73,
      "confidence": 0.903,
      "class": "player",
      "class_id": 0,
      "detection_id": "5956021f-ec46-4f3b-a56b-f61ff078dbb1"
    },
    {
      "x": 682,
      "y": 362.5,
      "width": 42,
      "height": 83,
      "confidence": 0.902,
      "class": "player",
      "class_id": 0,
      "detection_id": "886d4c53-7abd-4111-8068-ee6b865142ee"
    },
    {
      "x": 569,
      "y": 131.5,
      "width": 34,
      "height": 63,
      "confidence": 0.897,
      "class": "player",
      "class_id": 0,
      "detection_id": "17485a06-717f-4592-83d0-42894cc7b401"
    },
    {
      "x": 1018.5,
      "y": 400.5,
      "width": 39,
      "height": 85,
      "confidence": 0.896,
      "class": "player",
      "class_id": 0,
      "detection_id": "147f4d40-978d-439f-a6a6-f7a7f9b5184d"
    },
    {
      "x": 189,
      "y": 354,
      "width": 44,
      "height": 94,
      "confidence": 0.893,
      "class": "player",
      "class_id": 0,
      "detection_id": "d4f42b03-594b-4c2f-b384-54a71b04bc5b"
    },
    {
      "x": 694,
      "y": 193.5,
      "width": 34,
      "height": 69,
      "confidence": 0.891,
      "class": "player",
      "class_id": 0,
      "detection_id": "35f847bc-3ecd-422d-90f3-b74dacfdbd33"
    },
    {
      "x": 826,
      "y": 322,
      "width": 34,
      "height": 88,
      "confidence": 0.89,
      "class": "ref",
      "class_id": 1,
      "detection_id": "ab02f8de-902e-495c-9988-b1829c9b89dc"
    },
    {
      "x": 236,
      "y": 328,
      "width": 38,
      "height": 96,
      "confidence": 0.889,
      "class": "player",
      "class_id": 0,
      "detection_id": "49596639-697c-4a08-bcf4-849f24fce78c"
    },
    {
      "x": 529,
      "y": 397,
      "width": 64,
      "height": 90,
      "confidence": 0.889,
      "class": "player",
      "class_id": 0,
      "detection_id": "8133a6df-fa97-46bf-b38d-4c3400666c53"
    },
    {
      "x": 879,
      "y": 214.5,
      "width": 34,
      "height": 69,
      "confidence": 0.886,
      "class": "player",
      "class_id": 0,
      "detection_id": "3216b71d-0344-4c84-92f3-b01e7ab81652"
    },
    {
      "x": 534.5,
      "y": 329,
      "width": 67,
      "height": 54,
      "confidence": 0.88,
      "class": "player",
      "class_id": 0,
      "detection_id": "771ae14a-da18-45c9-bf96-8df6e7a248bc"
    },
    {
      "x": 459,
      "y": 343.5,
      "width": 56,
      "height": 61,
      "confidence": 0.872,
      "class": "player",
      "class_id": 0,
      "detection_id": "2351aeb8-5e32-4b01-8490-b710102e1847"
    },
    {
      "x": 414.5,
      "y": 374,
      "width": 53,
      "height": 74,
      "confidence": 0.861,
      "class": "player",
      "class_id": 0,
      "detection_id": "41f46066-c483-46db-9e50-116baac2fce6"
    },
    {
      "x": 421.5,
      "y": 310.5,
      "width": 57,
      "height": 49,
      "confidence": 0.793,
      "class": "player",
      "class_id": 0,
      "detection_id": "702b6259-728d-46a5-8e39-29e010ce8f1a"
    }
  ]
}

# Create figure and axis
fig, ax = plt.subplots(1, 1, figsize=(12, 8))

# Colors for different classes
colors = {'player': 'blue', 'ref': 'red'}
alpha_values = {'player': 0.3, 'ref': 0.5}

# Plot each detection
for detection in data['predictions']:
    x = detection['x']
    y = detection['y']
    width = detection['width']
    height = detection['height']
    confidence = detection['confidence']
    class_name = detection['class']
    
    # Calculate rectangle position (x,y seems to be center coordinates)
    rect_x = x - width/2
    rect_y = y - height/2
    
    # Create rectangle
    rect = patches.Rectangle((rect_x, rect_y), width, height, 
                           linewidth=2, 
                           edgecolor=colors[class_name], 
                           facecolor=colors[class_name],
                           alpha=alpha_values[class_name])
    
    # Add rectangle to plot
    ax.add_patch(rect)
    
    # Add center point
    ax.plot(x, y, 'o', color=colors[class_name], markersize=4)
    
    # Add confidence label
    ax.text(x, y-height/2-10, f'{confidence:.3f}', 
            ha='center', va='top', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.2', facecolor='white', alpha=0.7))

# Set axis properties
ax.set_xlim(0, 1200)  # Adjust based on your image dimensions
ax.set_ylim(0, 600)   # Adjust based on your image dimensions
ax.invert_yaxis()     # Invert y-axis to match image coordinates (0,0 at top-left)

# Add grid
ax.grid(True, alpha=0.3)

# Labels and title
ax.set_xlabel('X Coordinate')
ax.set_ylabel('Y Coordinate')
ax.set_title('Object Detection Results\n(Blue: Players, Red: Referees)')

# Add legend
from matplotlib.lines import Line2D
legend_elements = [Line2D([0], [0], color='blue', lw=4, label='Player'),
                  Line2D([0], [0], color='red', lw=4, label='Referee')]
ax.legend(handles=legend_elements, loc='upper right')

# Add statistics
total_detections = len(data['predictions'])
player_count = sum(1 for d in data['predictions'] if d['class'] == 'player')
ref_count = sum(1 for d in data['predictions'] if d['class'] == 'ref')
avg_confidence = sum(d['confidence'] for d in data['predictions']) / total_detections

ax.text(0.02, 0.98, f'Total Detections: {total_detections}\nPlayers: {player_count}\nReferees: {ref_count}\nAvg Confidence: {avg_confidence:.3f}', 
        transform=ax.transAxes, verticalalignment='top',
        bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

plt.tight_layout()
plt.show()

# Print summary statistics
print(f"Detection Summary:")
print(f"Total detections: {total_detections}")
print(f"Players: {player_count}")
print(f"Referees: {ref_count}")
print(f"Average confidence: {avg_confidence:.3f}")
print(f"Confidence range: {min(d['confidence'] for d in data['predictions']):.3f} - {max(d['confidence'] for d in data['predictions']):.3f}")