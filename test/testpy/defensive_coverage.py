import math

def calculate_distance(player_a, player_b):
    dx = player_a['coordinates']['x_yards'] - player_b['coordinates']['x_yards']
    dy = player_a['coordinates']['y_yards'] - player_b['coordinates']['y_yards']
    return math.sqrt(dx**2 + dy**2)

def classify_coverage_v5(play_data):
    """
    Classifies defensive coverage into specific play types
    Focused on Cover 0, Cover 1, Cover 2, Cover 3, and Cover 4
    with man vs. zone distinctions.
    Thresholds scaled for mapping where 11 real yards = 7 mapped yards.
    """

    # --- Scaling Factor ---
    SCALE = 7.0 / 11.0  # ~0.636

    # --- Thresholds (mapped yards) ---
    DEEP_SAFETY_MIN = 10.0 * SCALE   # ~6.4 mapped yards
    PRESS_YARDS = 2.0 * SCALE        # ~1.3 mapped yards
    MAN_MATCH_YARDS = 5.0 * SCALE    # ~3.2 mapped yards
    SHALLOW_FLAT_YARDS = 4.0 * SCALE # ~2.5 mapped yards
    LB_DEEP_DROP = 8.0 * SCALE       # ~5.1 mapped yards

    # --- Player Filtering ---
    defense = [p for p in play_data.get("players", []) if p.get("team") == "defense"]
    offense = [p for p in play_data.get("players", []) if p.get("team") == "offense"]

    safeties = [p for p in defense if p.get("position") in ["S", "FS", "SS"]]
    dbs = [p for p in defense if p.get("position") in ["DB", "CB"]]
    lbs = [p for p in defense if p.get("position") in ["LB", "MLB", "OLB"]]
    receivers = [p for p in offense if p.get("position") in ["WR", "TE"]]

    # --- Core Analysis ---
    deep_safeties = [s for s in safeties if abs(s['coordinates']['x_yards']) >= DEEP_SAFETY_MIN]
    num_deep_safeties = len(deep_safeties)

    man_signals = 0
    zone_signals = 0
    press_corners = 0
    shallow_corners = 0

    if receivers and dbs:
        for db in dbs:
            closest_receiver = min(receivers, key=lambda r: calculate_distance(db, r))
            distance = calculate_distance(db, closest_receiver)

            if distance <= MAN_MATCH_YARDS:
                man_signals += 1
            else:
                zone_signals += 1

            if distance <= PRESS_YARDS:
                press_corners += 1

            if abs(db['coordinates']['x_yards']) <= SHALLOW_FLAT_YARDS:
                shallow_corners += 1

    lb_depths = [lb['coordinates']['x_yards'] for lb in lbs if 'coordinates' in lb]
    avg_lb_depth = abs(sum(lb_depths)) / len(lb_depths) if lb_depths else 0

    # --- Coverage Classification ---
    coverage = "Unknown"

    if num_deep_safeties == 0:
        if man_signals >= len(dbs) - 1:
            coverage = "Cover 0 (All-out Man Blitz)"
        else:
            coverage = "Cover 0 Variant (Blitz/Robber)"

    elif num_deep_safeties == 1:
        if man_signals > zone_signals:
            coverage = "Cover 1 (Man Free)"
        else:
            coverage = "Cover 3 Zone"

    elif num_deep_safeties == 2:
        if man_signals > zone_signals:
            coverage = "Cover 2 Man"
        else:
            coverage = "Cover 2 Zone"

    elif num_deep_safeties >= 3:
        if man_signals > zone_signals:
            coverage = "Cover 4 Man (Quarters Man-Match)"
        else:
            coverage = "Cover 4 Zone (Quarters Zone)"

    return {
        "coverage_call": coverage,
        "analysis": {
            "deep_safeties": num_deep_safeties,
            "man_signals": man_signals,
            "zone_signals": zone_signals,
            "press_corners": press_corners,
            "avg_lb_depth": round(avg_lb_depth, 2)
        }
    }
