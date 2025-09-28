# list_teams_by_season.py
import requests

API_KEY = "a3e8954d27d2617f1669e265761f1457"
API_HOST = "v1.american-football.api-sports.io"

headers = {
    "x-rapidapi-key": API_KEY,
    "x-rapidapi-host": API_HOST
}

def list_all_teams_by_season(season):
    """Fetches and prints all NFL teams for a given season."""
    url = f"https://{API_HOST}/teams"
    
    # Parameters are required for this endpoint.
    # We will use the league ID for the NFL (1) and the user-provided season.
    params = {
        "league": 1, 
        "season": season
    }
    
    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    if data["response"]:
        print(f"\n--- NFL Teams List for {season} Season ---")
        # Sort teams by name for easy reading
        sorted_teams = sorted(data["response"], key=lambda team: team['name'])
        for team in sorted_teams:
            print(f"ID: {team['id']:<3} | Name: {team['name']}")
    else:
        print(f"Could not fetch team data for the {season} season.")
        print("API Response:", data)

if __name__ == "__main__":
    try:
        season_input = int(input("Enter the season (e.g., 2024 or 2025): "))
        list_all_teams_by_season(season_input)
    except ValueError:
        print("Invalid input. Please enter a valid year.")