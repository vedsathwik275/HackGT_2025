import matplotlib.pyplot as plt
import numpy as np
import json

# Load the detection data
detection_data = {
    "predictions": [
        {"x": 351.5, "y": 241, "width": 61, "height": 68, "confidence": 0.927, "class": "player", "class_id": 0, "detection_id": "0b7f9539-f4f1-4872-ad08-42d21355bba9"},
        {"x": 380, "y": 469, "width": 80, "height": 102, "confidence": 0.917, "class": "player", "class_id": 0, "detection_id": "7c5e5c3a-f56e-4e6f-9ebc-1d3a448e4a83"},
        {"x": 473, "y": 185, "width": 48, "height": 74, "confidence": 0.915, "class": "player", "class_id": 0, "detection_id": "be6372b0-b7bb-42f9-ac20-6a042db321cb"},
        {"x": 528.5, "y": 281, "width": 61, "height": 52, "confidence": 0.907, "class": "player", "class_id": 0, "detection_id": "5ef24bef-3fb5-46e6-a91a-9deea896f10a"},
        {"x": 532, "y": 473.5, "width": 54, "height": 95, "confidence": 0.904, "class": "player", "class_id": 0, "detection_id": "340e07c6-5787-42f6-832a-51836d5e24e4"},
        {"x": 632.5, "y": 238.5, "width": 35, "height": 81, "confidence": 0.904, "class": "player", "class_id": 0, "detection_id": "84ce3940-4735-4a63-ad0c-3f36815a72d6"},
        {"x": 414.5, "y": 122.5, "width": 47, "height": 73, "confidence": 0.903, "class": "player", "class_id": 0, "detection_id": "5956021f-ec46-4f3b-a56b-f61ff078dbb1"},
        {"x": 682, "y": 362.5, "width": 42, "height": 83, "confidence": 0.902, "class": "player", "class_id": 0, "detection_id": "886d4c53-7abd-4111-8068-ee6b865142ee"},
        {"x": 569, "y": 131.5, "width": 34, "height": 63, "confidence": 0.897, "class": "player", "class_id": 0, "detection_id": "17485a06-717f-4592-83d0-42894cc7b401"},
        {"x": 1018.5, "y": 400.5, "width": 39, "height": 85, "confidence": 0.896, "class": "player", "class_id": 0, "detection_id": "147f4d40-978d-439f-a6a6-f7a7f9b5184d"},
        {"x": 189, "y": 354, "width": 44, "height": 94, "confidence": 0.893, "class": "player", "class_id": 0, "detection_id": "d4f42b03-594b-4c2f-b384-54a71b04bc5b"},
        {"x": 694, "y": 193.5, "width": 34, "height": 69, "confidence": 0.891, "class": "player", "class_id": 0, "detection_id": "35f847bc-3ecd-422d-90f3-b74dacfdbd33"},
        {"x": 826, "y": 322, "width": 34, "height": 88, "confidence": 0.89, "class": "ref", "class_id": 1, "detection_id": "ab02f8de-902e-495c-9988-b1829c9b89dc"},
        {"x": 236, "y": 328, "width": 38, "height": 96, "confidence": 0.889, "class": "player", "class_id": 0, "detection_id": "49596639-697c-4a08-bcf4-849f24fce78c"},
        {"x": 529, "y": 397, "width": 64, "height": 90, "confidence": 0.889, "class": "player", "class_id": 0, "detection_id": "8133a6df-fa97-46bf-b38d-4c3400666c53"},
        {"x": 879, "y": 214.5, "width": 34, "height": 69, "confidence": 0.886, "class": "player", "class_id": 0, "detection_id": "3216b71d-0344-4c84-92f3-b01e7ab81652"},
        {"x": 534.5, "y": 329, "width": 67, "height": 54, "confidence": 0.88, "class": "player", "class_id": 0, "detection_id": "771ae14a-da18-45c9-bf96-8df6e7a248bc"},
        {"x": 459, "y": 343.5, "width": 56, "height": 61, "confidence": 0.872, "class": "player", "class_id": 0, "detection_id": "2351aeb8-5e32-4b01-8490-b710102e1847"},
        {"x": 414.5, "y": 374, "width": 53, "height": 74, "confidence": 0.861, "class": "player", "class_id": 0, "detection_id": "41f46066-c483-46db-9e50-116baac2fce6"},
        {"x": 421.5, "y": 310.5, "width": 57, "height": 49, "confidence": 0.793, "class": "player", "class_id": 0, "detection_id": "702b6259-728d-46a5-8e39-29e010ce8f1a"}
    ]
}

def classify_offense_defense(players, line_of_scrimmage_x):
    """
    Classify players as offense or defense based on their position relative to the line of scrimmage.
    In American football, one team lines up on one side of the line, the other team on the other side.
    """
    offense = []
    defense = []
    
    for player in players:
        if player['class'] != 'player':
            continue
            
        x = player['x']
        
        # Players to the left of line of scrimmage vs right
        # You may need to flip this depending on which direction your team is going
        if x < line_of_scrimmage_x:
            offense.append(player)
        else:
            defense.append(player)
    
    return offense, defense

def estimate_line_of_scrimmage(players):
    """
    Estimate line of scrimmage to create roughly balanced teams (around 11 players each).
    Try multiple methods to find the best split.
    """
    player_list = [p for p in players if p['class'] == 'player']
    if len(player_list) < 4:
        return None
    
    x_positions = [p['x'] for p in player_list]
    x_sorted = sorted(x_positions)
    
    # Method 1: Find position that creates most balanced split
    best_line = None
    best_balance_score = float('inf')
    
    # Try different potential line positions
    for i in range(len(x_sorted) - 1):
        potential_line = (x_sorted[i] + x_sorted[i + 1]) / 2
        
        # Count players on each side
        left_count = sum(1 for x in x_positions if x < potential_line)
        right_count = sum(1 for x in x_positions if x >= potential_line)
        
        # Score based on how close to 50/50 split (ideal for football)
        balance_score = abs(left_count - right_count)
        
        # Prefer splits that are closer to even
        if balance_score < best_balance_score:
            best_balance_score = balance_score
            best_line = potential_line
    
    # Method 2: If no good balanced split found, try median approach
    if best_line is None or best_balance_score > 6:  # Allow some imbalance but not too much
        # Try positions around the median
        median_x = np.median(x_positions)
        
        # Test a few positions around median
        test_positions = [
            median_x - 50, median_x - 25, median_x, 
            median_x + 25, median_x + 50
        ]
        
        for test_line in test_positions:
            left_count = sum(1 for x in x_positions if x < test_line)
            right_count = sum(1 for x in x_positions if x >= test_line)
            balance_score = abs(left_count - right_count)
            
            if balance_score < best_balance_score:
                best_balance_score = balance_score
                best_line = test_line
    
    # Method 3: Last resort - use the position that gives closest to 50/50 split
    if best_line is None:
        target_left = len(player_list) // 2
        best_line = x_sorted[target_left] if target_left < len(x_sorted) else np.median(x_positions)
    
    return best_line

def create_football_diagram():
    """
    Create a 2D American football play diagram with correct field orientation
    """
    # Set up the plot - make it vertical (taller than wide) like a football field section
    fig, ax = plt.subplots(1, 1, figsize=(10, 12))
    
    # Extract all players and referee
    all_detections = detection_data['predictions']
    players = [d for d in all_detections if d['class'] == 'player']
    refs = [d for d in all_detections if d['class'] == 'ref']
    
    # Estimate line of scrimmage (vertical line)
    line_of_scrimmage_x = estimate_line_of_scrimmage(players)
    
    # Classify offense and defense based on line of scrimmage
    offense, defense = classify_offense_defense(players, line_of_scrimmage_x)
    
    # Plot offensive players (blue circles)
    if offense:
        off_x = [p['x'] for p in offense]
        off_y = [p['y'] for p in offense]
        ax.scatter(off_x, off_y, c='blue', s=150, alpha=0.8, 
                  label=f'Offense ({len(offense)})', edgecolors='navy', linewidth=2)
        
        # Add player numbers for offense
        for i, (x, y) in enumerate(zip(off_x, off_y)):
            ax.annotate(f'O{i+1}', (x, y), xytext=(5, 5), textcoords='offset points', 
                       fontsize=8, color='white', weight='bold')
    
    # Plot defensive players (red circles)  
    if defense:
        def_x = [p['x'] for p in defense]
        def_y = [p['y'] for p in defense]
        ax.scatter(def_x, def_y, c='red', s=150, alpha=0.8, 
                  label=f'Defense ({len(defense)})', edgecolors='darkred', linewidth=2)
        
        # Add player numbers for defense
        for i, (x, y) in enumerate(zip(def_x, def_y)):
            ax.annotate(f'D{i+1}', (x, y), xytext=(5, 5), textcoords='offset points', 
                       fontsize=8, color='white', weight='bold')
    
    # Plot referee (yellow triangle)
    if refs:
        ref_x = [r['x'] for r in refs]
        ref_y = [r['y'] for r in refs]
        ax.scatter(ref_x, ref_y, c='yellow', s=200, marker='^', 
                  label='Referee', edgecolors='black', linewidth=2)
    
    # Draw line of scrimmage (VERTICAL line)
    if line_of_scrimmage_x:
        y_min = min([p['y'] for p in all_detections]) - 20
        y_max = max([p['y'] for p in all_detections]) + 20
        ax.axvline(x=line_of_scrimmage_x, color='green', linestyle='--', linewidth=4,
                  alpha=0.8, label='Line of Scrimmage')
        
        # Add line of scrimmage label
        ax.text(line_of_scrimmage_x, y_min - 10, 'LINE OF SCRIMMAGE', 
               rotation=90, ha='center', va='top', fontweight='bold', color='green')
    
    # Add field markings
    x_min = min([p['x'] for p in all_detections]) - 50
    x_max = max([p['x'] for p in all_detections]) + 50
    y_min = min([p['y'] for p in all_detections]) - 50
    y_max = max([p['y'] for p in all_detections]) + 50
    
    # Draw yard lines (horizontal lines every 50 pixels to simulate yard markers)
    for y in range(int(y_min), int(y_max), 40):
        ax.axhline(y=y, color='lightgreen', alpha=0.3, linewidth=0.8)
    
    # Draw hash marks (short vertical lines)
    hash_length = 20
    for y in range(int(y_min), int(y_max), 20):
        # Left hash marks
        ax.plot([x_min + 50, x_min + 50 + hash_length], [y, y], 
               color='lightgreen', alpha=0.6, linewidth=1)
        # Right hash marks  
        ax.plot([x_max - 50 - hash_length, x_max - 50], [y, y], 
               color='lightgreen', alpha=0.6, linewidth=1)
    
    # Set field boundaries
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_max, y_min)  # Invert y-axis so field flows top to bottom
    
    # Labels and title
    ax.set_xlabel('Field Width (Left ← → Right)', fontsize=12)
    ax.set_ylabel('Field Length (Upfield ↑ ↓ Downfield)', fontsize=12)
    ax.set_title('American Football Play Diagram\n(Bird\'s Eye View)', 
                fontsize=16, fontweight='bold', pad=20)
    
    # Add directional arrows to show field orientation
    if line_of_scrimmage_x:
        # Arrow showing offensive direction
        arrow_y = (y_min + y_max) / 2
        if offense and defense:
            off_avg_x = np.mean([p['x'] for p in offense])
            if off_avg_x < line_of_scrimmage_x:
                # Offense going right
                ax.annotate('', xy=(x_max - 30, arrow_y), xytext=(x_max - 80, arrow_y),
                           arrowprops=dict(arrowstyle='->', lw=3, color='blue', alpha=0.7))
                ax.text(x_max - 55, arrow_y - 15, 'Offense Direction', 
                       ha='center', color='blue', fontweight='bold')
            else:
                # Offense going left  
                ax.annotate('', xy=(x_min + 30, arrow_y), xytext=(x_min + 80, arrow_y),
                           arrowprops=dict(arrowstyle='->', lw=3, color='blue', alpha=0.7))
                ax.text(x_min + 55, arrow_y - 15, 'Offense Direction', 
                       ha='center', color='blue', fontweight='bold')
    
    # Add legend
    ax.legend(loc='upper left', fontsize=10, bbox_to_anchor=(0.02, 0.98))
    
    # Add grid
    ax.grid(True, alpha=0.2)
    
    # Add summary info box
    balance_diff = abs(len(offense) - len(defense)) if offense and defense else 0
    balance_status = "✓ Balanced" if balance_diff <= 3 else "⚠ Unbalanced" if balance_diff <= 6 else "❌ Very Unbalanced"
    
    info_text = f'Players: {len(players)} | Referees: {len(refs)}\n'
    info_text += f'Split: {len(offense)}-{len(defense)} | {balance_status}\n'
    info_text += f'Avg Confidence: {np.mean([d["confidence"] for d in all_detections]):.1%}'
    ax.text(0.98, 0.02, info_text, transform=ax.transAxes, 
           fontsize=9, verticalalignment='bottom', horizontalalignment='right',
           bbox=dict(boxstyle='round,pad=0.5', facecolor='white', alpha=0.8))
    
    # Make the plot look more like a football field
    ax.set_facecolor('#2E8B57')  # Dark green background
    
    plt.tight_layout()
    return fig, ax

def print_detection_summary():
    """
    Print a summary of the detections
    """
    all_detections = detection_data['predictions']
    players = [d for d in all_detections if d['class'] == 'player']
    refs = [d for d in all_detections if d['class'] == 'ref']
    
    print("=== American Football Play Detection Summary ===")
    print(f"Total detections: {len(all_detections)}")
    print(f"Players: {len(players)}")
    print(f"Referees: {len(refs)}")
    print(f"Average confidence: {np.mean([d['confidence'] for d in all_detections]):.3f}")
    
    # Estimate line of scrimmage
    line_x = estimate_line_of_scrimmage(players)
    print(f"Estimated Line of Scrimmage (x-coordinate): {line_x:.1f}")
    
    # Show player distribution
    offense, defense = classify_offense_defense(players, line_x)
    print(f"\nTeam Distribution:")
    print(f"  Left side of LOS: {len(offense)} players")
    print(f"  Right side of LOS: {len(defense)} players")
    
    # Check if split seems reasonable for football
    total_players = len(players)
    if total_players >= 20:  # Should have close to 22 players total
        balance_diff = abs(len(offense) - len(defense))
        if balance_diff <= 3:
            print("  ✓ Good team balance for football")
        elif balance_diff <= 6:
            print("  ⚠ Somewhat unbalanced - may need line adjustment")
        else:
            print("  ❌ Very unbalanced - line of scrimmage detection may be off")
    
    print(f"\nPlayer positions (x=horizontal, y=vertical):")
    for i, player in enumerate(players):
        side = "LEFT" if player['x'] < line_x else "RIGHT"
        print(f"  Player {i+1}: ({player['x']:.1f}, {player['y']:.1f}) - {side} - Conf: {player['confidence']:.3f}")
    
    if refs:
        print(f"\nReferee position: ({refs[0]['x']:.1f}, {refs[0]['y']:.1f}) - Confidence: {refs[0]['confidence']:.3f}")

if __name__ == "__main__":
    # Print summary
    print_detection_summary()
    
    # Create the diagram
    fig, ax = create_football_diagram()
    
    # Show the plot
    plt.show()
    
    # Optionally save the diagram
    # plt.savefig('american_football_play_diagram.png', dpi=300, bbox_inches='tight')