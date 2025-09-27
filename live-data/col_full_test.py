import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import time

def scrape_all_boxscores():
    """Main function to scrape all games and their detailed box scores"""
    
    print("Starting comprehensive ESPN college football scraper...")
    
    # Step 1: Get all game IDs from scoreboard
    game_ids = scrape_game_ids_from_scoreboard()
    
    if not game_ids:
        print("No games found on scoreboard")
        return None
    
    print(f"Found {len(game_ids)} games to scrape")
    
    # Step 2: Scrape detailed data for each game
    all_games_data = {
        'scrape_timestamp': datetime.now().isoformat(),
        'total_games': len(game_ids),
        'games': {}
    }
    
    for i, game_id in enumerate(game_ids, 1):
        print(f"Scraping game {i}/{len(game_ids)}: {game_id}")
        
        game_data = scrape_comprehensive_boxscore(game_id)
        if game_data:
            all_games_data['games'][game_id] = game_data
        
        # Small delay to be respectful
        time.sleep(1)
    
    # Step 3: Save all data
    filename = f"all_college_football_games_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    save_all_games_data(all_games_data, filename)
    
    return all_games_data

def scrape_game_ids_from_scoreboard(url="https://www.espn.com/college-football/scoreboard"):
    """Extract all game IDs from the scoreboard"""
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all box score links
        box_score_links = soup.find_all('a', href=re.compile(r'/college-football/boxscore/_/gameId/\d+'))
        
        game_ids = []
        for link in box_score_links:
            href = link.get('href')
            game_id = extract_game_id(href)
            if game_id and game_id not in game_ids:
                game_ids.append(game_id)
        
        return game_ids
        
    except requests.RequestException as e:
        print(f"Error fetching scoreboard: {e}")
        return []

def extract_game_id(href):
    """Extract game ID from href"""
    match = re.search(r'gameId/(\d+)', href)
    return match.group(1) if match else None

def scrape_comprehensive_boxscore(game_id):
    """Scrape comprehensive box score for a single game"""
    
    url = f"https://www.espn.com/college-football/boxscore/_/gameId/{game_id}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        game_data = {
            'game_id': game_id,
            'game_info': scrape_game_info(soup),
            'teams': scrape_detailed_boxscore(soup)
        }
        
        return game_data
        
    except requests.RequestException as e:
        print(f"Error fetching game {game_id}: {e}")
        return None

def scrape_game_info(soup):
    """Extract game information from Gamestrip__Container"""
    
    game_info = {
        'teams': [],
        'game_status': {},
        'quarter_scores': {}
    }
    
    gamestrip = soup.find('div', class_='Gamestrip__Container')
    if not gamestrip:
        return game_info
    
    # Extract team information
    team_sections = gamestrip.find_all('div', class_='mLASH VZTD rEPuv jIRH bmjsw')
    
    for section in team_sections[:2]:
        team_info = {}
        
        team_link = section.find('a', {'data-clubhouse-uid': True})
        if team_link:
            team_name_div = team_link.find('span', class_='NzyJW NMnSM')
            short_name_div = team_link.find('span', class_='NzyJW SQItX euiGf')
            abbr_div = team_link.find('span', class_='HUcap mpjVY')
            
            if team_name_div:
                team_info['full_name'] = team_name_div.get_text().strip()
            if short_name_div:
                team_info['short_name'] = short_name_div.get_text().strip()
            if abbr_div:
                team_info['abbreviation'] = abbr_div.get_text().strip()
                
            href = team_link.get('href', '')
            team_id_match = re.search(r'/id/(\d+)/', href)
            if team_id_match:
                team_info['team_id'] = team_id_match.group(1)
        
        score_div = section.find('div', class_='mxQbE JFXP VZTD jWGd vSsiS osdYE')
        if score_div:
            team_info['current_score'] = score_div.get_text().strip()
        
        record_div = section.find('div', class_='alYYJ QCELl VZTD FWLyZ duTyi csTyU rBhDC GpQCA tuAKv xTell bmjsw NYdiI fuwnA')
        if record_div:
            team_info['record'] = record_div.get_text().strip()
        
        game_info['teams'].append(team_info)
    
    # Game status
    status_div = gamestrip.find('div', class_='mLASH VZTD rEPuv jIRH xWwgP YphCQ')
    if status_div:
        time_spans = status_div.find_all('span', class_='hsDdd FuEs zRALO')
        if len(time_spans) >= 2:
            game_info['game_status'] = {
                'time_remaining': time_spans[0].get_text().strip(),
                'quarter': time_spans[1].get_text().strip()
            }
    
    # Quarter scores
    score_table = gamestrip.find('table', {'data-testid': 'prism-Table'})
    if score_table:
        headers = []
        header_row = score_table.find('thead')
        if header_row:
            for th in header_row.find_all('th'):
                headers.append(th.get_text().strip())
        
        rows = score_table.find('tbody').find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if cells:
                team_cell = cells[0]
                team_link = team_cell.find('a')
                if team_link:
                    team_name = team_link.get_text().strip()
                    scores = [cell.get_text().strip() for cell in cells[1:]]
                    game_info['quarter_scores'][team_name] = dict(zip(headers[1:], scores))
    
    return game_info

def scrape_detailed_boxscore(soup):
    """Extract detailed player statistics"""
    
    teams_data = {}
    boxscore_div = soup.find('div', class_='Boxscore')
    if not boxscore_div:
        return teams_data
    
    categories = boxscore_div.find_all('div', class_='Boxscore__Category')
    
    for category in categories:
        teams = category.find_all('div', class_='Boxscore__Team')
        
        for team in teams:
            team_title = team.find('div', class_='TeamTitle__Name')
            if not team_title:
                continue
                
            title_text = team_title.get_text().strip()
            parts = title_text.split(' ')
            team_name = ' '.join(parts[:-1])
            stat_category = parts[-1].lower()
            
            if team_name not in teams_data:
                teams_data[team_name] = {}
            
            teams_data[team_name][stat_category] = extract_player_stats(team)
    
    return teams_data

def extract_player_stats(team_section):
    """Extract player stats from team section"""
    
    stats = {'players': [], 'team_totals': {}}
    
    table_section = team_section.find('div', class_='ResponsiveTable')
    if not table_section:
        empty_table = team_section.find('table', class_='EmptyBoxScore__Table')
        if empty_table:
            empty_msg = empty_table.find('td', class_='Empty__Message')
            if empty_msg:
                stats['message'] = empty_msg.get_text().strip()
        return stats
    
    scroller = table_section.find('div', class_='Table__Scroller')
    if not scroller:
        return stats
        
    # Get headers
    headers = []
    header_rows = scroller.find_all('tr', class_='Table__sub-header')
    if header_rows:
        for th in header_rows[-1].find_all('th'):
            header_text = th.get_text().strip()
            if header_text:
                headers.append(header_text)
    
    # Get player names
    fixed_table = table_section.find('table', class_='Table--fixed-left')
    player_names = []
    if fixed_table:
        player_rows = fixed_table.find_all('tr', {'data-idx': True})
        for row in player_rows:
            if 'Boxscore__Totals' not in row.get('class', []):
                athlete_div = row.find('div', class_='Boxscore__Athlete')
                if athlete_div:
                    player_info = {}
                    name_link = athlete_div.find('a', class_='Boxscore__Athlete_Name')
                    jersey_span = athlete_div.find('span', class_='Boxscore__Athlete_Jersey')
                    
                    if name_link:
                        player_info['name'] = name_link.get_text().strip()
                        player_info['player_url'] = name_link.get('href', '')
                        player_id_match = re.search(r'/id/(\d+)/', player_info['player_url'])
                        if player_id_match:
                            player_info['player_id'] = player_id_match.group(1)
                    
                    if jersey_span:
                        jersey_text = jersey_span.get_text().strip()
                        jersey_num = re.search(r'#(\d+)', jersey_text)
                        if jersey_num:
                            player_info['jersey'] = jersey_num.group(1)
                    
                    player_names.append(player_info)
    
    # Get stats
    stat_rows = scroller.find_all('tr', class_=['Table__TR', 'Table__TR--sm', 'Table__even'])
    player_index = 0
    
    for row in stat_rows:
        if 'Boxscore__Totals' in row.get('class', []):
            stat_cells = row.find_all('td', class_='Table__TD')
            if stat_cells and headers:
                totals = {}
                for j, cell in enumerate(stat_cells):
                    if j < len(headers):
                        totals[headers[j]] = cell.get_text().strip()
                stats['team_totals'] = totals
        else:
            stat_cells = row.find_all('td', class_='Table__TD')
            if stat_cells and player_index < len(player_names):
                player_data = player_names[player_index].copy()
                player_data['stats'] = {}
                
                for j, cell in enumerate(stat_cells):
                    if j < len(headers):
                        stat_value = cell.get_text().strip()
                        if stat_value:
                            player_data['stats'][headers[j]] = stat_value
                
                stats['players'].append(player_data)
                player_index += 1
    
    return stats

def save_all_games_data(data, filename):
    """Save all games data to JSON file"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved {data['total_games']} games to {filename}")

def print_summary(data):
    """Print summary of scraped data"""
    print(f"\nScrape completed: {data['total_games']} games")
    print("=" * 50)
    
    for game_id, game_data in data['games'].items():
        game_info = game_data.get('game_info', {})
        teams = game_info.get('teams', [])
        
        if len(teams) >= 2:
            team1 = teams[0].get('short_name', 'Team 1')
            team2 = teams[1].get('short_name', 'Team 2')
            score1 = teams[0].get('current_score', '0')
            score2 = teams[1].get('current_score', '0')
            
            print(f"{game_id}: {team1} {score1} - {score2} {team2}")

def main():
    """Main execution function"""
    all_data = scrape_all_boxscores()
    
    if all_data:
        print_summary(all_data)
        return all_data
    else:
        print("Scraping failed")
        return None

if __name__ == "__main__":
    main()