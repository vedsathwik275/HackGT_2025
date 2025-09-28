import requests
import json
from datetime import datetime

# Your provided API key
API_KEY = "a3e8954d27d2617f1669e265761f1457"
API_HOST = "v1.american-football.api-sports.io"

headers = {
    "x-rapidapi-key": API_KEY,
    "x-rapidapi-host": API_HOST
}

def select_team(team_name_query):
    """
    Searches for teams matching a query and prompts the user to select one.
    Returns the selected team's ID.
    """
    url = f"https://{API_HOST}/teams"
    params = {"search": team_name_query}
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    
    if not data["response"]:
        print(f"Error: No teams found for '{team_name_query}'.")
        return None
        
    if len(data["response"]) == 1:
        team = data["response"][0]
        print(f"Found: {team['name']} ({team['code']})")
        return team["id"]
        
    print(f"Multiple teams found for '{team_name_query}'. Please choose one:")
    for i, team in enumerate(data["response"]):
        print(f"  {i + 1}: {team['name']} ({team['code']})")
        
    while True:
        try:
            choice = int(input("Enter the number of your choice: "))
            if 1 <= choice <= len(data["response"]):
                return data["response"][choice - 1]["id"]
            else:
                print("Invalid number. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number.")

def select_player(player_name_query, team_id):
    """
    Searches for players on a specific team and prompts the user to select one.
    Returns the selected player's ID.
    Tries the current season first, then falls back to the previous season.
    """
    url = f"https://{API_HOST}/players"
    current_season = datetime.now().year
    
    # --- First, try the current season ---
    params = {"team": team_id, "search": player_name_query, "season": current_season}
    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    # --- If no player is found, try the previous season ---
    if not data["response"]:
        print(f"No players found for '{player_name_query}' in {current_season}. Trying {current_season - 1}...")
        params["season"] = current_season - 1
        response = requests.get(url, headers=headers, params=params)
        data = response.json()

    if not data["response"]:
        print(f"Error: No players found for '{player_name_query}' on this team for the last two seasons.")
        return None
        
    if len(data["response"]) == 1:
        player = data["response"][0]
        print(f"Found: {player['name']}, Position: {player['position']} (Season {params['season']})")
        return player["id"], params["season"]
        
    print(f"Multiple players found for '{player_name_query}'. Please choose one:")
    for i, player in enumerate(data["response"]):
        print(f"  {i + 1}: {player['name']}, Position: {player['position']} (Season {params['season']})")

    while True:
        try:
            choice = int(input("Enter the number of your choice: "))
            if 1 <= choice <= len(data["response"]):
                return data["response"][choice - 1]["id"], params["season"]
            else:
                print("Invalid number. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number.")

def get_h2h(team1_id, team2_id):
    """Gets the head-to-head matchups for two teams."""
    url = f"https://{API_HOST}/games"
    params = {"h2h": f"{team1_id}-{team2_id}"}
    response = requests.get(url, headers=headers, params=params)
    return response.json()

def get_player_stats(player_id, team_id, season):
    """Gets the statistics for a given player, team, and season."""
    url = f"https://{API_HOST}/players/statistics"
    params = {"player": player_id, "team": team_id, "season": season}
    response = requests.get(url, headers=headers, params=params)
    return response.json()


if __name__ == "__main__":
    # --- Head to Head Matchup ---
    print("--- Finding Head-to-Head Matchup ---")
    team1_name = input("Enter the first NFL team name (e.g., Philadelphia): ")
    team1_id = select_team(team1_name)

    if team1_id:
        team2_name = input("Enter the second NFL team name (e.g., Los Angeles Rams): ")
        team2_id = select_team(team2_name)
    
        if team2_id:
            h2h_data = get_h2h(team1_id, team2_id)
            if h2h_data["response"]:
                most_recent_game = h2h_data["response"][-1]
                print("\n--- Most Recent Head-to-Head Matchup ---")
                print(f"Date: {most_recent_game['game']['date']['date']}")
                home_team = most_recent_game['teams']['home']['name']
                away_team = most_recent_game['teams']['away']['name']
                home_score = most_recent_game['scores']['home']['total']
                away_score = most_recent_game['scores']['away']['total']
                print(f"Match: {home_team} vs. {away_team}")
                print(f"Final Score: {home_score} - {away_score}")
            else:
                print("No head-to-head matchups found in the database.")
    
    print("\n" + "="*50 + "\n")

    # --- Player Statistics ---
    print("--- Finding Player Statistics ---")
    player_team_name = input("Enter the NFL team name for the player search: ")
    player_team_id = select_team(player_team_name)

    if player_team_id:
        player_name = input("Enter the player's name (e.g., Jalen Hurts): ")
        # The select_player function now returns both the ID and the season it was found in
        player_result = select_player(player_name, player_team_id)
        
        if player_result:
            player_id, season_found = player_result
            stats_data = get_player_stats(player_id, player_team_id, season_found)
            
            if stats_data["response"]:
                player_info = stats_data["response"][0]
                print(f"\n--- Player Statistics for {player_info['player']['name']} ({season_found} Season) ---")
                print(json.dumps(player_info["games"], indent=2))
            else:
                print(f"No statistics found for this player in the {season_found} season.")