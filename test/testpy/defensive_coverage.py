import json
import math
import sys
from pathlib import Path

def calculate_distance(p1, p2):
    """Calculates the Euclidean distance between two players."""
    return math.sqrt(
        (p1['coordinates']['x_yards'] - p2['coordinates']['x_yards'])**2 +
        (p1['coordinates']['y_yards'] - p2['coordinates']['y_yards'])**2
    )

def classify_coverage_v2(play_data):
    """
    Classifies defensive coverage with more nuance by analyzing player alignments
    relative to each other to infer man vs. zone indicators.
    """
    # --- Configuration Thresholds ---
    DEEP_ZONE_YARDS = 9.0
    MAN_COVERAGE_PROXIMITY_YARDS = 6.0
    PRESS_COVERAGE_YARDS = 2.0
    SHALLOW_CORNER_YARDS = 4.0 # For differentiating Cover 2 Zone

    # --- Player Filtering ---
    defense = [p for p in play_data.get("players", []) if p.get("team") == "defense"]
    offense = [p for p in play_data.get("players", []) if p.get("team") == "offense"]

    safeties = [p for p in defense if p.get("position") in ["S", "FS", "SS"]]
    dbs = [p for p in defense if p.get("position") in ["DB", "CB"]]
    lbs = [p for p in defense if p.get("position") in ["LB", "MLB", "OLB"]]
    receivers = [p for p in offense if p.get("position") in ["WR", "TE"]]

    # --- Core Analysis ---
    deep_safeties = [s for s in safeties if s['coordinates']['x_yards'] >= DEEP_ZONE_YARDS]
    num_deep_safeties = len(deep_safeties)

    # 1. Analyze Man vs. Zone Indicators by pairing DBs to nearest WRs
    man_signals = 0
    zone_signals = 0
    shallow_corners = 0
    
    # Only run this analysis if there are receivers and DBs to pair
    if receivers and dbs:
        for db in dbs:
            # Find the closest receiver to this DB
            closest_receiver = min(receivers, key=lambda r: calculate_distance(db, r))
            distance_to_receiver = calculate_distance(db, closest_receiver)

            if distance_to_receiver < MAN_COVERAGE_PROXIMITY_YARDS:
                man_signals += 1
            else:
                zone_signals += 1
            
            # Check for shallow corners specifically for Cover 2 Zone diagnosis
            if db['coordinates']['x_yards'] < SHALLOW_CORNER_YARDS:
                shallow_corners +=1

    # 2. Analyze Linebacker Depth
    lb_depths = [lb['coordinates']['x_yards'] for lb in lbs if 'coordinates' in lb]
    avg_lb_depth = sum(lb_depths) / len(lb_depths) if lb_depths else 0

    # --- Decision Logic ---
    primary_guess = "Unknown"
    secondary_guess = "None"
    shell = "Unknown"

    if num_deep_safeties == 0:
        shell = "Zero-High"
        primary_guess = "Cover 0 (Man Blitz)"
        secondary_guess = "Cover 1 Robber (with a lurking LB/S)"

    elif num_deep_safeties == 1:
        shell = "Single-High"
        if man_signals > zone_signals:
            primary_guess = "Cover 1 (Man Free)"
            secondary_guess = "Cover 3 (Zone)"
        else:
            primary_guess = "Cover 3 (Zone)"
            secondary_guess = "Cover 1 (Man Free)"

    elif num_deep_safeties == 2:
        shell = "Two-High"
        # Check for Tampa 2 first (deep middle LB)
        if any(d > 6.0 for d in lb_depths):
             primary_guess = "Tampa 2 (Zone)"
             secondary_guess = "Cover 2 Zone"
        # If DBs are playing tight man, it's likely Cover 2 Man
        elif man_signals > zone_signals and zone_signals <= 1:
            primary_guess = "Cover 2 Man"
            secondary_guess = "Quarters (Man-match)"
        # If corners are pressed shallow, they are likely playing the flats
        elif shallow_corners >= 2:
            primary_guess = "Cover 2 Zone"
            secondary_guess = "Quarters (Trap)"
        # Default two-high zone look is Quarters, the most common modern coverage
        else:
            primary_guess = "Cover 4 / Quarters (Zone)"
            secondary_guess = "Cover 2 Zone"

    return {
        "primary_guess": primary_guess,
        "secondary_guess": secondary_guess,
        "shell": shell,
        "analysis": {
            "deep_safeties_found": num_deep_safeties,
            "man_coverage_signals": man_signals,
            "zone_coverage_signals": zone_signals,
            "avg_linebacker_depth_yards": round(avg_lb_depth, 2)
        }
    }

# --- Example Usage ---
if __name__ == "__main__":
    def find_play_json(cli_path=None):
        if cli_path and Path(cli_path).exists():
            return Path(cli_path)
        
        script_dir = Path(__file__).resolve().parent
        candidates = [script_dir / "play.json", Path.cwd() / "play.json"]
        for c in candidates:
            if c.exists():
                return c
        raise FileNotFoundError(f"play.json not found in checked locations: {candidates}")

    # Load play.json (either provided as CLI arg or found in candidates)
    cli = sys.argv[1] if len(sys.argv) > 1 else None
    try:
        play_path = find_play_json(cli)
    except FileNotFoundError as e:
        print("Error:", e)
        sys.exit(2)

    with play_path.open('r', encoding='utf-8') as pf:
        play_data = json.load(pf)

    # Run analysis
    result = classify_coverage_v2(play_data)
    print(json.dumps(result, indent=2))