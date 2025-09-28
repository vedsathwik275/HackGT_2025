import matplotlib.pyplot as plt
import numpy as np
import json
import sys
from pathlib import Path

def is_player_position(class_name):
    """Helper function to check if a class represents a player position"""
    player_positions = {'QB', 'RB', 'WR', 'C', 'OG', 'OT', 'FB', 'TE', 'DE', 'DT', 'LB', 'DB', 'S', 'CB', 'FS', 'SS'}
    return class_name in player_positions

# Load the detection data with player positions
detection_data = {
    "predictions": [
        {"x": 907.5, "y": 252, "width": 45, "height": 74, "confidence": 0.911, "class": "LB", "class_id": 5, "detection_id": "ec7cfd37-a25a-4cf1-a2f3-b9622efe0747"},
        {"x": 441, "y": 677, "width": 74, "height": 106, "confidence": 0.897, "class": "WR", "class_id": 14, "detection_id": "b9d18ccc-2199-4147-ad66-6bfa89a031cf"},
        {"x": 740, "y": 540, "width": 48, "height": 102, "confidence": 0.896, "class": "LB", "class_id": 5, "detection_id": "e3d33d07-46f9-41f6-b196-18dce2001ed4"},
        {"x": 360.5, "y": 396.5, "width": 45, "height": 99, "confidence": 0.893, "class": "RB", "class_id": 9, "detection_id": "b5a73cc1-f907-43a1-9e9a-6f7225f2a6bf"},
        {"x": 747.5, "y": 108.5, "width": 41, "height": 75, "confidence": 0.89, "class": "WR", "class_id": 14, "detection_id": "5b113f6b-9b20-4d3f-b865-fd4c1a942b41"},
        {"x": 425, "y": 557, "width": 58, "height": 108, "confidence": 0.89, "class": "WR", "class_id": 14, "detection_id": "0c6314d0-0b72-4693-af2b-7c0b42f0093a"},
        {"x": 1232.5, "y": 604.5, "width": 45, "height": 105, "confidence": 0.881, "class": "DB", "class_id": 1, "detection_id": "6041b8c8-b060-460e-b0b0-e9367813005a"},
        {"x": 586.5, "y": 685, "width": 61, "height": 94, "confidence": 0.881, "class": "DB", "class_id": 1, "detection_id": "58a9637a-6b46-4239-8728-63b4dac93e27"},
        {"x": 591, "y": 310.5, "width": 50, "height": 69, "confidence": 0.879, "class": "WING", "class_id": 13, "detection_id": "fc08806b-ae57-406b-82ce-8651ba0fd75b"},
        {"x": 695.5, "y": 392, "width": 51, "height": 64, "confidence": 0.87, "class": "DT", "class_id": 3, "detection_id": "84cce67d-06aa-465a-967d-528665e46b9e"},
        {"x": 542.5, "y": 438, "width": 57, "height": 86, "confidence": 0.856, "class": "OT", "class_id": 7, "detection_id": "5c6110c5-d367-4387-b69c-773b8d7454d8"},
        {"x": 851, "y": 411.5, "width": 50, "height": 87, "confidence": 0.852, "class": "LB", "class_id": 5, "detection_id": "8a4cf2e5-f7e1-471f-90b2-1793e030a6ab"},
        {"x": 674.5, "y": 441.5, "width": 57, "height": 71, "confidence": 0.83, "class": "DE", "class_id": 2, "detection_id": "b8a022a0-7f33-431a-bacc-f476b40de890"},
        {"x": 839, "y": 350, "width": 46, "height": 72, "confidence": 0.824, "class": "LB", "class_id": 5, "detection_id": "0b8c98f9-2d1b-4d36-ba32-18460b9a3e0d"},
        {"x": 384.5, "y": 363, "width": 35, "height": 98, "confidence": 0.814, "class": "QB", "class_id": 8, "detection_id": "1e36a048-c4b2-453e-a102-a9d884fe375d"},
        {"x": 578.5, "y": 411.5, "width": 53, "height": 61, "confidence": 0.807, "class": "OG", "class_id": 6, "detection_id": "9823ab7c-e5a6-43d5-81bd-7140e5d6f5cf"},
        {"x": 613.5, "y": 356, "width": 51, "height": 44, "confidence": 0.805, "class": "OG", "class_id": 6, "detection_id": "b5d6fb3f-25a8-4fa1-b3ca-f7656fa680d1"},
        {"x": 621, "y": 384.5, "width": 52, "height": 67, "confidence": 0.769, "class": "C", "class_id": 0, "detection_id": "2af611be-c883-4230-91be-912b4b15bc22"},
        {"x": 626, "y": 327, "width": 56, "height": 46, "confidence": 0.764, "class": "OT", "class_id": 7, "detection_id": "469ffaec-bda3-411d-b60b-e7fecaf99432"},
        {"x": 728.5, "y": 354, "width": 57, "height": 66, "confidence": 0.746, "class": "DT", "class_id": 3, "detection_id": "1a6b81c7-e6fd-4b9f-8aa3-6e263f6374ff"},
        {"x": 1213.5, "y": 262.5, "width": 37, "height": 91, "confidence": 0.696, "class": "S", "class_id": 11, "detection_id": "06e61547-602e-4853-9925-d0eae433f8c8"},
        {"x": 1203.5, "y": 138, "width": 39, "height": 82, "confidence": 0.665, "class": "DB", "class_id": 1, "detection_id": "b560ea3e-c3bb-4dd2-a359-b0b79dd1d9c8"},
        {"x": 728.5, "y": 353.5, "width": 57, "height": 65, "confidence": 0.649, "class": "DE", "class_id": 2, "detection_id": "64389ec2-490b-4cd9-824e-6b30c01270df"}
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

def add_yard_markings(ax, field_dims, line_of_scrimmage_x, x_min, x_max, y_min, y_max):
    """
    Add proper American football yard markings within the given boundaries.
    """
    # Calculate yard positions
    pixels_per_yard = field_dims['pixels_per_yard']
    
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
                    ax.text(x_pos, y_min + 15, f'{yard_count * 5}', 
                           ha='center', va='bottom', fontsize=9, color='white', weight='bold')
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
                    ax.text(x_pos, y_min + 15, f'{yard_count * 5}', 
                           ha='center', va='bottom', fontsize=9, color='white', weight='bold')
            x_pos += yard_line_interval
            yard_count += 1
    
    # Add sidelines at the boundaries of the plot
    ax.axhline(y=y_min, color='white', linewidth=4, alpha=0.9, label='Sideline')
    ax.axhline(y=y_max, color='white', linewidth=4, alpha=0.9)

def create_football_diagram(detection_data):
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
    
    # Define plot boundaries based on player positions with precise padding
    padding = 100  # Sets the space from the outermost players to the edge of the plot
    x_min = min([p['x'] for p in all_detections]) - padding
    x_max = max([p['x'] for p in all_detections]) + padding
    y_min = min([p['y'] for p in all_detections]) - padding
    y_max = max([p['y'] for p in all_detections]) + padding

    # Add proper football field markings using these boundaries
    add_yard_markings(ax, field_dims, line_of_scrimmage_x, x_min, x_max, y_min, y_max)
    
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
        plot_top_y = min(p['y'] for p in all_detections)
        ax.text(line_of_scrimmage_x + 10, plot_top_y, 'LOS', 
               rotation=90, ha='left', va='top', fontweight='bold', 
               color='yellow', fontsize=11, 
               bbox=dict(boxstyle='round,pad=0.3', facecolor='black', alpha=0.7))
    
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

# Main execution block
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

    # Call classifier from defensive_coverage.py (if available)
    try:
        script_dir = Path(__file__).resolve().parent
        sys.path.insert(0, str(script_dir / 'testpy'))
        from defensive_coverage import classify_coverage_v2

        coverage_result = classify_coverage_v2(mapped_data)
        print("\n=== Defensive Coverage (inline call) ===")
        print(json.dumps(coverage_result, indent=2))
        # write result file
        try:
            out_path = script_dir / 'testpy' / 'coverage_result_inline.json'
            with out_path.open('w', encoding='utf-8') as cf:
                json.dump(coverage_result, cf, indent=2)
            print(f"Saved inline coverage result to: {out_path}")
        except Exception as e:
            print(f"Warning: failed to save inline coverage result: {e}")
    except Exception as e:
        print(f"Warning: could not import/run classify_coverage_v2: {e}")
    
    # Create and save the diagram
    fig, ax = create_football_diagram(detection_data)
    fig.savefig('american_football_play_diagram.png', dpi=300, bbox_inches='tight')
    # Show the plot
    plt.show()
    
    # Optionally save the diagram
    plt.close(fig)
