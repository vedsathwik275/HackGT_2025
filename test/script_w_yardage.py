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

def calculate_field_dimensions(all_detections, line_of_scrimmage_x, players):
    """
    Calculate field dimensions and yard scaling using football-specific measurements.
    Uses the fact that offensive backfield depth is typically 0-5 yards from LOS.
    """
    x_positions = [d['x'] for d in all_detections]
    y_positions = [d['y'] for d in all_detections]
    
    field_width_pixels = max(x_positions) - min(x_positions)
    field_length_pixels = max(y_positions) - min(y_positions)
    
    # Use offensive backfield depth to calculate accurate scale
    pixels_per_yard = None
    
    if line_of_scrimmage_x and players:
        # Get offensive players (assume they're on one side of LOS)
        offense, defense = classify_offense_defense(players, line_of_scrimmage_x)
        
        if len(offense) >= 3:  # Need enough players to get a good measurement
            # Find the offensive player closest to LOS and furthest from LOS
            offense_x_positions = [p['x'] for p in offense]
            
            if line_of_scrimmage_x > np.mean(offense_x_positions):
                # Offense is to the left of LOS
                closest_to_los = max(offense_x_positions)  # Rightmost offensive player
                furthest_from_los = min(offense_x_positions)  # Leftmost offensive player
            else:
                # Offense is to the right of LOS
                closest_to_los = min(offense_x_positions)  # Leftmost offensive player
                furthest_from_los = max(offense_x_positions)  # Rightmost offensive player
            
            # Calculate backfield depth in pixels
            backfield_depth_pixels = abs(furthest_from_los - closest_to_los)
            
            # In your case, you mentioned it's 5 yards apart (QB to RB)
            # But we'll make it adaptive: typical range is 0-5 yards
            # Use 5 yards as maximum, but could be less if formation is tighter (e.g. 3 yards)  
            estimated_backfield_depth_yards = min(5, max(3, backfield_depth_pixels / 40))  # Reasonable range
            
            pixels_per_yard = backfield_depth_pixels / estimated_backfield_depth_yards
            
            print(f"Debug: Backfield depth = {backfield_depth_pixels:.1f} pixels = {estimated_backfield_depth_yards} yards")
            print(f"Debug: Calculated scale = {pixels_per_yard:.1f} pixels per yard")
    
    # Fallback method if we can't use backfield measurement
    if pixels_per_yard is None:
        # Use width estimation as fallback
        estimated_width_yards = min(40, max(25, field_width_pixels / 20))
        pixels_per_yard = field_width_pixels / estimated_width_yards
    
    # Calculate dimensions using actual NFL field width (53.3 yards)
    nfl_field_width_yards = 53.3
    nfl_field_width_pixels = nfl_field_width_yards * pixels_per_yard
    
    # Find the center of all detected players/refs in y-direction
    field_center_y = (min(y_positions) + max(y_positions)) / 2
    
    # Calculate proper sideline positions based on NFL field width
    sideline_top = field_center_y - (nfl_field_width_pixels / 2)
    sideline_bottom = field_center_y + (nfl_field_width_pixels / 2)
    
    # Keep original detection bounds for reference
    detected_width_yards = field_width_pixels / pixels_per_yard
    estimated_length_yards = field_length_pixels / pixels_per_yard
    
    return {
        'width_pixels': nfl_field_width_pixels,  # Use actual NFL width
        'length_pixels': field_length_pixels,
        'width_yards': nfl_field_width_yards,    # Use actual NFL width (53.3 yards)
        'length_yards': estimated_length_yards,
        'pixels_per_yard': pixels_per_yard,
        'x_min': min(x_positions),
        'x_max': max(x_positions),
        'y_min': sideline_top,      # Proper top sideline position
        'y_max': sideline_bottom,   # Proper bottom sideline position
        'detected_y_min': min(y_positions),  # Original detection bounds for reference
        'detected_y_max': max(y_positions),
        'detected_width_yards': detected_width_yards,  # Original detected width for comparison
        'field_center_y': field_center_y,
        'backfield_measurement_used': pixels_per_yard is not None
    }

def add_yard_markings(ax, field_dims, line_of_scrimmage_x):
    """
    Add proper American football yard markings
    """
    # Calculate yard positions
    pixels_per_yard = field_dims['pixels_per_yard']
    
    # Extend field boundaries for yard markings
    x_min = field_dims['x_min'] - 50
    x_max = field_dims['x_max'] + 50
    y_min = field_dims['y_min'] - 50
    y_max = field_dims['y_max'] + 50
    
    # Add yard lines (every 5 yards) - VERTICAL lines parallel to line of scrimmage
    yard_line_interval = 5 * pixels_per_yard  # 5-yard intervals
    
    # Start from line of scrimmage and go both directions
    if line_of_scrimmage_x:
        # Yard lines to the left of LOS
        x_pos = line_of_scrimmage_x
        yard_count = 0
        while x_pos > x_min:
            if x_pos >= x_min:
                ax.axvline(x=x_pos, color='white', alpha=0.6, linewidth=1)
                # Add yard number every 10 yards
                if yard_count % 2 == 0 and yard_count > 0:  # Every 10 yards
                    ax.text(x_pos, y_min - 10, f'{yard_count * 5}', 
                           ha='center', va='top', fontsize=9, color='white', weight='bold')
            x_pos -= yard_line_interval
            yard_count += 1
        
        # Yard lines to the right of LOS
        x_pos = line_of_scrimmage_x
        yard_count = 0
        while x_pos < x_max:
            if x_pos <= x_max:
                ax.axvline(x=x_pos, color='white', alpha=0.6, linewidth=1)
                # Add yard number every 10 yards
                if yard_count % 2 == 0 and yard_count > 0:  # Every 10 yards
                    ax.text(x_pos, y_min - 10, f'{yard_count * 5}', 
                           ha='center', va='top', fontsize=9, color='white', weight='bold')
            x_pos += yard_line_interval
            yard_count += 1
    
    
    # Add sidelines at proper NFL field width (53.3 yards apart)
    # Top and bottom sidelines (horizontal lines)
    ax.axhline(y=field_dims['y_min'], color='white', linewidth=4, alpha=0.9, label='Sideline (53.3 yd width)')
    ax.axhline(y=field_dims['y_max'], color='white', linewidth=4, alpha=0.9)
    
    return x_min, x_max, y_min, y_max

def create_football_diagram():
    """
    Create a 2D American football play diagram with correct field orientation and proper yard markings
    """
    # Set up the plot - make it vertical (taller than wide) like a football field section
    fig, ax = plt.subplots(1, 1, figsize=(10, 12))
    
    # Extract all players and referee
    all_detections = detection_data['predictions']
    players = [d for d in all_detections if d['class'] == 'player']
    refs = [d for d in all_detections if d['class'] == 'ref']
    
    # Estimate line of scrimmage (vertical line)
    line_of_scrimmage_x = estimate_line_of_scrimmage(players)
    
    # Calculate field dimensions using football-specific measurements
    field_dims = calculate_field_dimensions(all_detections, line_of_scrimmage_x, players)
    
    # Classify offense and defense based on line of scrimmage
    offense, defense = classify_offense_defense(players, line_of_scrimmage_x)
    
    # Add proper football field markings
    x_min, x_max, y_min, y_max = add_yard_markings(ax, field_dims, line_of_scrimmage_x)
    
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
        ax.axvline(x=line_of_scrimmage_x, color='yellow', linestyle='-', linewidth=4,
                  alpha=0.9, label='Line of Scrimmage', zorder=10)
        
        # Add line of scrimmage label
        ax.text(line_of_scrimmage_x + 10, y_min + 20, 'LINE OF SCRIMMAGE', 
               rotation=90, ha='left', va='bottom', fontweight='bold', 
               color='yellow', fontsize=11, 
               bbox=dict(boxstyle='round,pad=0.3', facecolor='black', alpha=0.7))
    
    # Add field markings
    x_min = min([p['x'] for p in all_detections]) - 50
    x_max = max([p['x'] for p in all_detections]) + 50
    y_min = min([p['y'] for p in all_detections]) - 50
    y_max = max([p['y'] for p in all_detections]) + 50
    
    
    # Set field boundaries
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_max, y_min)  # Invert y-axis so field flows top to bottom
    
    # Labels and title
    ax.set_xlabel(f'Field Width (~{field_dims["width_yards"]:.1f} yards)', fontsize=12)
    ax.set_ylabel(f'Field Length (~{field_dims["length_yards"]:.1f} yards)', fontsize=12)
    ax.set_title('American Football Play Diagram\n(Bird\'s Eye View with Yard Markings)', 
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
    info_text += f'Field: {field_dims["width_yards"]:.1f}×{field_dims["length_yards"]:.1f} yards (NFL standard)\n'
    info_text += f'Player spread: {field_dims["detected_width_yards"]:.1f} yards wide\n'
    
    if field_dims.get('backfield_measurement_used'):
        info_text += f'Scale: {field_dims["pixels_per_yard"]:.1f} px/yd (backfield-based)\n'
    else:
        info_text += f'Scale: {field_dims["pixels_per_yard"]:.1f} px/yd (estimated)\n'
        
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
    
    # Calculate field dimensions for summary - now with correct parameters
    field_dims = calculate_field_dimensions(all_detections, line_x, players)
    
    scaling_method = "backfield depth (accurate)" if field_dims.get('backfield_measurement_used') else "estimated from spread"
    print(f"NFL field dimensions: {field_dims['width_yards']:.1f} × {field_dims['length_yards']:.1f} yards")
    print(f"Player detection spread: {field_dims['detected_width_yards']:.1f} × {field_dims['length_yards']:.1f} yards")
    print(f"Scale: {field_dims['pixels_per_yard']:.1f} pixels per yard ({scaling_method})")
    
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

def map_coordinates(detection_data, line_of_scrimmage_x, field_dims):
    """
    Map pixel coordinates to field-relative coordinates in yards and export to JSON.
    
    Coordinate system:
    - X-axis: Line of scrimmage is at x=0, positive values are in one direction, negative in the other
    - Y-axis: Field center is at y=0, positive values toward one sideline, negative toward the other
    - All coordinates are in yards
    """
    mapped_data = {
        "metadata": {
            "coordinate_system": {
                "x_axis": "Line of scrimmage at x=0, offensive direction is positive",
                "y_axis": "Field center at y=0, sidelines at ±26.65 yards",
                "units": "yards"
            },
            "field_dimensions": {
                "width_yards": field_dims['width_yards'],
                "length_yards": field_dims['length_yards'],
                "pixels_per_yard": field_dims['pixels_per_yard']
            },
            "line_of_scrimmage_pixel": line_of_scrimmage_x,
            "field_center_y_pixel": field_dims['field_center_y']
        },
        "players": [],
        "referees": []
    }
    
    pixels_per_yard = field_dims['pixels_per_yard']
    field_center_y = field_dims['field_center_y']
    
    # Process all detections
    all_detections = detection_data['predictions']
    players = [d for d in all_detections if d['class'] == 'player']
    
    # Classify offense and defense
    offense, defense = classify_offense_defense(players, line_of_scrimmage_x)
    
    # Map player coordinates
    for detection in all_detections:
        if detection['class'] == 'player':
            # Convert pixel coordinates to yard coordinates relative to line of scrimmage and field center
            x_yards = (detection['x'] - line_of_scrimmage_x) / pixels_per_yard
            y_yards = (detection['y'] - field_center_y) / pixels_per_yard
            
            # Determine team
            team = "offense" if detection in offense else "defense"
            
            player_data = {
                "detection_id": detection['detection_id'],
                "team": team,
                "coordinates": {
                    "x_yards": round(x_yards, 2),  # Distance from line of scrimmage
                    "y_yards": round(y_yards, 2),  # Distance from field center
                    "original_pixel_x": detection['x'],
                    "original_pixel_y": detection['y']
                },
                "confidence": detection['confidence'],
                "bounding_box": {
                    "width_pixels": detection['width'],
                    "height_pixels": detection['height'],
                    "width_yards": round(detection['width'] / pixels_per_yard, 2),
                    "height_yards": round(detection['height'] / pixels_per_yard, 2)
                }
            }
            mapped_data["players"].append(player_data)
        
        elif detection['class'] == 'ref':
            # Convert referee coordinates
            x_yards = (detection['x'] - line_of_scrimmage_x) / pixels_per_yard
            y_yards = (detection['y'] - field_center_y) / pixels_per_yard
            
            referee_data = {
                "detection_id": detection['detection_id'],
                "coordinates": {
                    "x_yards": round(x_yards, 2),
                    "y_yards": round(y_yards, 2),
                    "original_pixel_x": detection['x'],
                    "original_pixel_y": detection['y']
                },
                "confidence": detection['confidence'],
                "bounding_box": {
                    "width_pixels": detection['width'],
                    "height_pixels": detection['height'],
                    "width_yards": round(detection['width'] / pixels_per_yard, 2),
                    "height_yards": round(detection['height'] / pixels_per_yard, 2)
                }
            }
            mapped_data["referees"].append(referee_data)
    
    # Add team statistics
    mapped_data["team_stats"] = {
        "total_players": len(mapped_data["players"]),
        "offense_count": len(offense),
        "defense_count": len(defense),
        "referee_count": len(mapped_data["referees"]),
        "team_balance": "balanced" if abs(len(offense) - len(defense)) <= 3 else "unbalanced"
    }
    
    # Export to JSON file
    output_filename = "output.json"
    with open(output_filename, 'w') as f:
        json.dump(mapped_data, f, indent=2)
    
    print(f"\n=== Coordinate Mapping Complete ===")
    print(f"Mapped {len(mapped_data['players'])} players and {len(mapped_data['referees'])} referees")
    print(f"Exported to: {output_filename}")
    print(f"Coordinate system: Line of scrimmage at x=0, field center at y=0")
    print(f"Scale: {pixels_per_yard:.1f} pixels per yard")
    
    return mapped_data

if __name__ == "__main__":
    # Print summary
    print_detection_summary()
    
    # Get the data needed for coordinate mapping
    all_detections = detection_data['predictions']
    players = [d for d in all_detections if d['class'] == 'player']
    
    # Calculate line of scrimmage and field dimensions for coordinate mapping
    line_of_scrimmage_x = estimate_line_of_scrimmage(players)
    field_dims = calculate_field_dimensions(all_detections, line_of_scrimmage_x, players)
    
    # Map coordinates and export to JSON
    mapped_data = map_coordinates(detection_data, line_of_scrimmage_x, field_dims)
    
    # Create the diagram
    fig, ax = create_football_diagram()
    
    # Show the plot
    plt.show()
    
    # Optionally save the diagram
    # plt.savefig('american_football_play_diagram.png', dpi=300, bbox_inches='tight')