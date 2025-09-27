import matplotlib.pyplot as plt
import numpy as np
import json

def is_player_position(class_name):
    """Helper function to check if a class represents a player position"""
    player_positions = {'QB', 'RB', 'WR', 'C', 'OG', 'OT', 'FB', 'TE', 'DE', 'DT', 'LB', 'DB', 'S', 'CB', 'FS', 'SS'}
    return class_name in player_positions

# Load the detection data with player positions
detection_data = {
    "predictions": [
        {"x": 1246, "y": 362.5, "width": 48, "height": 97, "confidence": 0.899, "class": "S", "class_id": 11, "detection_id": "252cc2ae-5f0f-4688-878d-80e3742caad2"},
        {"x": 755.5, "y": 548, "width": 51, "height": 96, "confidence": 0.895, "class": "DB", "class_id": 1, "detection_id": "c1bd70bf-5e68-4fdc-acb6-d5fcf8821038"},
        {"x": 552.5, "y": 95.5, "width": 49, "height": 73, "confidence": 0.891, "class": "WR", "class_id": 14, "detection_id": "ae8f6e95-25ad-4ce2-a2d7-b2b9f3e857a2"},
        {"x": 776, "y": 96.5, "width": 34, "height": 79, "confidence": 0.873, "class": "DB", "class_id": 1, "detection_id": "9a255d88-ed05-4fd6-8ade-ed0ea0716234"},
        {"x": 681, "y": 376, "width": 50, "height": 90, "confidence": 0.865, "class": "LB", "class_id": 5, "detection_id": "f3425997-2625-4a4a-a146-991750289bed"},
        {"x": 634.5, "y": 290, "width": 53, "height": 92, "confidence": 0.863, "class": "LB", "class_id": 5, "detection_id": "c633b005-1c63-4954-a3cf-5ff625106812"},
        {"x": 550, "y": 231.5, "width": 66, "height": 71, "confidence": 0.861, "class": "WR", "class_id": 14, "detection_id": "e2e3082c-5a0c-455e-bbe0-44bddd72830e"},
        {"x": 194, "y": 373, "width": 40, "height": 108, "confidence": 0.86, "class": "QB", "class_id": 8, "detection_id": "82de9008-98fd-45b0-b1f3-3fd3a763c20a"},
        {"x": 575, "y": 314, "width": 64, "height": 70, "confidence": 0.816, "class": "DE", "class_id": 2, "detection_id": "0daf5f81-7664-4588-8df2-84d987dbb88d"},
        {"x": 225, "y": 326, "width": 40, "height": 80, "confidence": 0.81, "class": "RB", "class_id": 9, "detection_id": "3431fa19-b774-4e02-8ff4-c39c80f789c3"},
        {"x": 458.5, "y": 374, "width": 57, "height": 62, "confidence": 0.793, "class": "C", "class_id": 0, "detection_id": "6182ae3c-ba8e-48cd-a449-f78e0ac66588"},
        {"x": 514.5, "y": 487, "width": 53, "height": 112, "confidence": 0.79, "class": "DE", "class_id": 2, "detection_id": "ea2b8a61-3285-45e4-8e91-57de27564a1d"},
        {"x": 986, "y": 214.5, "width": 38, "height": 91, "confidence": 0.779, "class": "DB", "class_id": 1, "detection_id": "aec725ed-b01b-41ae-9075-6de72fa96452"},
        {"x": 436, "y": 317, "width": 48, "height": 56, "confidence": 0.777, "class": "OT", "class_id": 7, "detection_id": "8d2698b7-0d9b-4e4b-a5ee-dd823bf80b5a"},
        {"x": 969.5, "y": 474.5, "width": 49, "height": 113, "confidence": 0.776, "class": "S", "class_id": 11, "detection_id": "29a9be92-aee6-41e9-a64f-6bca2a7eb3db"},
        {"x": 233.5, "y": 451, "width": 33, "height": 104, "confidence": 0.764, "class": "WR", "class_id": 14, "detection_id": "6d181f4b-2135-444f-bbe0-d3ecbe1611ab"},
        {"x": 434.5, "y": 350.5, "width": 51, "height": 55, "confidence": 0.728, "class": "OG", "class_id": 6, "detection_id": "279c6b90-2e9b-4a94-9024-4e024f545522"},
        {"x": 406, "y": 431, "width": 60, "height": 78, "confidence": 0.728, "class": "OG", "class_id": 6, "detection_id": "f8a9cba5-e9df-46ee-b50c-7eba3ee4d55d"},
        {"x": 555.5, "y": 404.5, "width": 67, "height": 93, "confidence": 0.575, "class": "DT", "class_id": 3, "detection_id": "3c9639ef-9c9e-409c-8663-ca136c938d45"},
        {"x": 402, "y": 380, "width": 48, "height": 54, "confidence": 0.55, "class": "OG", "class_id": 6, "detection_id": "04a023c7-6409-4661-b1a0-6fd9ca743df1"}
    ]
}

def classify_offense_defense(players, line_of_scrimmage_x=None):
    """
    Classify players as offense or defense based on their actual position names.
    This is much more accurate than spatial analysis.
    """
    offense = []
    defense = []
    
    # Define offensive and defensive positions
    offensive_positions = {'QB', 'RB', 'WR', 'C', 'OG', 'OT', 'FB', 'TE'}
    defensive_positions = {'DE', 'DT', 'LB', 'DB', 'S', 'CB', 'FS', 'SS'}
    
    for player in players:
        position = player['class']
        
        if position in offensive_positions:
            offense.append(player)
        elif position in defensive_positions:
            defense.append(player)
        else:
            # If unknown position, still add to a team based on spatial analysis as fallback
            if line_of_scrimmage_x is not None:
                x = player['x']
                if x < line_of_scrimmage_x:
                    offense.append(player)
                else:
                    defense.append(player)
            else:
                # If no line of scrimmage, add to defense as default
                defense.append(player)
    
    return offense, defense

def estimate_line_of_scrimmage(players):
    """
    Estimate line of scrimmage to create roughly balanced teams (around 11 players each).
    Try multiple methods to find the best split.
    """
    player_list = [p for p in players if is_player_position(p['class'])]
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
    
    # Extract all players (no referees in new data)
    all_detections = detection_data['predictions']
    players = [d for d in all_detections if is_player_position(d['class'])]
    refs = []  # No referees in the new position data
    
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
        
        # Add player position labels for offense
        for i, player in enumerate(offense):
            x, y = player['x'], player['y']
            position = player['class']
            ax.annotate(position, (x, y), xytext=(5, 5), textcoords='offset points', 
                       fontsize=8, color='white', weight='bold')
    
    # Plot defensive players (red circles)  
    if defense:
        def_x = [p['x'] for p in defense]
        def_y = [p['y'] for p in defense]
        ax.scatter(def_x, def_y, c='red', s=150, alpha=0.8, 
                  label=f'Defense ({len(defense)})', edgecolors='darkred', linewidth=2)
        
        # Add player position labels for defense
        for i, player in enumerate(defense):
            x, y = player['x'], player['y']
            position = player['class']
            ax.annotate(position, (x, y), xytext=(5, 5), textcoords='offset points', 
                       fontsize=8, color='white', weight='bold')
    
    # No referees in position-based data
    
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
    
    info_text = f'Players: {len(players)} (with positions)\n'
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
    players = [d for d in all_detections if is_player_position(d['class'])]
    refs = []  # No referees in the new position data
    
    print("=== American Football Play Detection Summary ===")
    print(f"Total detections: {len(all_detections)}")
    print(f"Players: {len(players)} (with specific positions)")
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
        position = player['class']
        side = "LEFT" if player['x'] < line_x else "RIGHT"
        team = "OFFENSE" if position in {'QB', 'RB', 'WR', 'C', 'OG', 'OT', 'FB', 'TE'} else "DEFENSE"
        print(f"  {position}: ({player['x']:.1f}, {player['y']:.1f}) - {team} ({side}) - Conf: {player['confidence']:.3f}")
    
    # No referees in position-based data

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
    players = [d for d in all_detections if is_player_position(d['class'])]
    
    # Classify offense and defense
    offense, defense = classify_offense_defense(players, line_of_scrimmage_x)
    
    # Map player coordinates
    for detection in all_detections:
        if is_player_position(detection['class']):
            # Convert pixel coordinates to yard coordinates relative to line of scrimmage and field center
            x_yards = (detection['x'] - line_of_scrimmage_x) / pixels_per_yard
            y_yards = (detection['y'] - field_center_y) / pixels_per_yard
            
            # Determine team
            team = "offense" if detection in offense else "defense"
            
            player_data = {
                "detection_id": detection['detection_id'],
                "position": detection['class'],  # Player position (QB, WR, DE, etc.)
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
        
        # No referees in position-based data
    
    # Add team statistics with position breakdowns
    offensive_positions = {}
    defensive_positions = {}
    
    for player in mapped_data["players"]:
        position = player["position"]
        if player["team"] == "offense":
            offensive_positions[position] = offensive_positions.get(position, 0) + 1
        else:
            defensive_positions[position] = defensive_positions.get(position, 0) + 1
    
    mapped_data["team_stats"] = {
        "total_players": len(mapped_data["players"]),
        "offense_count": len(offense),
        "defense_count": len(defense),
        "team_balance": "balanced" if abs(len(offense) - len(defense)) <= 3 else "unbalanced",
        "offensive_positions": offensive_positions,
        "defensive_positions": defensive_positions
    }
    
    # Export to JSON file
    output_filename = "output.json"
    with open(output_filename, 'w') as f:
        json.dump(mapped_data, f, indent=2)
    
    print(f"\n=== Coordinate Mapping Complete ===")
    print(f"Mapped {len(mapped_data['players'])} players with specific positions")
    print(f"Exported to: {output_filename}")
    print(f"Coordinate system: Line of scrimmage at x=0, field center at y=0")
    print(f"Scale: {pixels_per_yard:.1f} pixels per yard")
    
    return mapped_data

if __name__ == "__main__":
    # Print summary
    print_detection_summary()
    
    # Get the data needed for coordinate mapping
    all_detections = detection_data['predictions']
    players = [d for d in all_detections if is_player_position(d['class'])]
    
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