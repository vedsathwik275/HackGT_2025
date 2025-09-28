import math
import os
import json

def calculate_distance(player_a, player_b):
    dx = player_a['coordinates']['x_yards'] - player_b['coordinates']['x_yards']
    dy = player_a['coordinates']['y_yards'] - player_b['coordinates']['y_yards']
    return math.sqrt(dx**2 + dy**2)


def classify_coverage_v2(play_data):
        """
        Classifies defensive coverage into specific play types:
        - Cover 0, Cover 1, Cover 2 (Man/Zone), Cover 3, Cover 4 (Man/Zone)
        Matches each receiver to its closest DB if aligned (y diff < ALIGNMENT_Y_DIFF).
        After matching all receivers, remaining DBs within 7 yards of LOS count as zone,
        DBs > 7 yards from LOS are counted as deep safeties.
        """
    
        # --- Thresholds (mapped yards) ---
        DEEP_SAFETY_MIN = 7    # distance from LOS considered "deep safety"
        DEEP_CORNER_MIN = 5    # ~5.7 mapped yards (kept for backward compatibility if needed)
        PRESS_YARDS = 3         # ~1.3 mapped yards
        MAN_MATCH_YARDS = 12    # distance threshold used when selecting closest DB (kept for safety)
        SHALLOW_FLAT_YARDS = 4.0
        ALIGNMENT_Y_DIFF = 1  # y difference (yards) to consider alignment -> man

        # --- Player Filtering ---
        defense = [p for p in play_data.get("players", []) if p.get("team") == "defense"]
        offense = [p for p in play_data.get("players", []) if p.get("team") == "offense"]

        dbs = [p for p in defense if p.get("position") in ["DB", "CB", "S", "FS", "SS"]]
        lbs = [p for p in defense if p.get("position") in ["LB", "MLB", "OLB"]]
        receivers = [p for p in offense if p.get("position") in ["WR", "TE"]]

        # --- Core Analysis ---
        deep_safeties = []
        man_signals = 0
        zone_signals = 0
        press_corners = 0
        shallow_corners = 0

        # Work on a mutable list of available DBs
        available_dbs = list(dbs)

        # For each receiver, find DBs aligned by y (within ALIGNMENT_Y_DIFF).
        # If multiple DBs qualify, pick the closest DB (euclidean distance).
        # When matched, remove that DB from available_dbs and increment man_signals.
        for receiver in receivers:
            # find aligned DB candidates among remaining DBs
            candidates = [
                db for db in available_dbs
                if abs(db['coordinates']['y_yards'] - receiver['coordinates']['y_yards']) <= ALIGNMENT_Y_DIFF and abs(db['coordinates']['x_yards']) <= 7
            ]

            if not candidates:
                # no aligned DBs for this receiver
                continue

            # pick the candidate DB with minimum euclidean distance to receiver
            closest_db = min(candidates, key=lambda db: calculate_distance(db, receiver))

            # count as man coverage signal and remove matched DB
            man_signals += 1
            try:
                available_dbs.remove(closest_db)
            except ValueError:
                # defensive: if not present, skip
                pass

            print(f"MAN MATCH: Receiver ({receiver.get('position')}) at (x:{receiver['coordinates']['x_yards']:.1f}, y:{receiver['coordinates']['y_yards']:.1f}) "
                f"matched to DB ({closest_db.get('position')}) at (x:{closest_db['coordinates']['x_yards']:.1f}, y:{closest_db['coordinates']['y_yards']:.1f})\n")

        # After matching receivers, classify remaining (unused) DBs:
        # - if within DEEP_SAFETY_MIN yards of LOS -> zone coverage contributor
        # - if greater than DEEP_SAFETY_MIN -> deep safety (DS)
        print(f"DEBUG: available_dbs count = {len(available_dbs)}")
        for i, db in enumerate(available_dbs):
            coords = db.get('coordinates', {}) or {}
            print(f"DEBUG DB[{i}]: position={db.get('position')} team={db.get('team')} x={coords.get('x_yards')} y={coords.get('y_yards')}")

        for db in available_dbs:
            dist_from_los = abs(db['coordinates']['x_yards'])
            if dist_from_los <= DEEP_SAFETY_MIN:
                zone_signals += 1
            else:
                deep_safeties.append(db)

        num_deep_safeties = len(deep_safeties)
        print(num_deep_safeties)

        lb_depths = [lb['coordinates']['x_yards'] for lb in lbs if 'coordinates' in lb]
        avg_lb_depth = abs(sum(lb_depths)) / len(lb_depths) if lb_depths else 0
    
        # --- Coverage Classification ---
        coverage = "Unknown"
    
        if num_deep_safeties == 0:
            coverage = "Cover 0 Man"

        elif num_deep_safeties == 1:
            if man_signals >= zone_signals:
                coverage = "Cover 1 (Man Free)"
            else:
                coverage = "Cover 3 Zone"
    
        elif num_deep_safeties == 2:
            if man_signals >= zone_signals:
                coverage = "Cover 2 Man"
            elif zone_signals <= 2:
                coverage = "Cover 2 Zone"
            else:
                coverage = "Cover 4 Zone"
    
        elif num_deep_safeties == 3:
            if man_signals >= zone_signals:
                coverage = "Cover 3 Man"
            else:
                coverage = "Cover 4 Zone"
        
        elif num_deep_safeties >= 4:
            coverage = "Prevent"
    
        coverage_analysis = {
            "coverage_call": coverage,
            "analysis": {
                "deep_safeties": num_deep_safeties,
                "deep_corners": len([c for c in dbs if abs(c['coordinates']['x_yards']) >= DEEP_CORNER_MIN]),
                "man_signals": man_signals,
                "zone_signals": zone_signals,
                "press_corners": press_corners,
                "shallow_corners": shallow_corners,
                "avg_lb_depth": round(avg_lb_depth, 2)
            }
        }
    
        # Save to output.json in the backend directory (keeps existing behavior)
        output_path = os.path.join(os.path.dirname(__file__), 'output.json')
        with open(output_path, 'w') as f:
            json.dump(coverage_analysis, f, indent=2)
    
        return coverage_analysis