import requests
from bs4 import BeautifulSoup
import json
import re

def scrape_comprehensive_boxscore(game_id):
    """Scrape comprehensive box score including game info and detailed stats"""
    
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
            'game_info': {},
            'teams': {},
            'detailed_stats': {}
        }
        
        # Scrape game info from Gamestrip__Container
        game_info = scrape_game_info(soup)
        game_data['game_info'] = game_info
        
        # Scrape detailed box score stats from Boxscore div
        detailed_stats = scrape_detailed_boxscore(soup)
        game_data['teams'] = detailed_stats
        
        return game_data
        
    except requests.RequestException as e:
        print(f"Error fetching boxscore: {e}")
        return None

def scrape_game_info(soup):
    """Extract game information from Gamestrip__Container"""
    
    game_info = {
        'teams': [],
        'score': {},
        'game_status': {},
        'quarter_scores': {}
    }
    
    gamestrip = soup.find('div', class_='Gamestrip__Container')
    if not gamestrip:
        return game_info
    
    # Extract team information and current scores
    team_sections = gamestrip.find_all('div', class_='mLASH VZTD rEPuv jIRH bmjsw')
    
    for i, section in enumerate(team_sections[:2]):  # Only first 2 team sections
        team_info = {}
        
        # Team logo and name
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
                
            # Team ID from href
            href = team_link.get('href', '')
            team_id_match = re.search(r'/id/(\d+)/', href)
            if team_id_match:
                team_info['team_id'] = team_id_match.group(1)
        
        # Current score
        score_div = section.find('div', class_='mxQbE JFXP VZTD jWGd vSsiS osdYE')
        if score_div:
            team_info['current_score'] = score_div.get_text().strip()
        
        # Record
        record_div = section.find('div', class_='alYYJ QCELl VZTD FWLyZ duTyi csTyU rBhDC GpQCA tuAKv xTell bmjsw NYdiI fuwnA')
        if record_div:
            team_info['record'] = record_div.get_text().strip()
        
        game_info['teams'].append(team_info)
    
    # Game status (time and quarter)
    status_div = gamestrip.find('div', class_='mLASH VZTD rEPuv jIRH xWwgP YphCQ')
    if status_div:
        time_spans = status_div.find_all('span', class_='hsDdd FuEs zRALO')
        if len(time_spans) >= 2:
            game_info['game_status'] = {
                'time_remaining': time_spans[0].get_text().strip(),
                'quarter': time_spans[1].get_text().strip()
            }
    
    # Quarter by quarter scores
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
                    scores = []
                    for cell in cells[1:]:
                        scores.append(cell.get_text().strip())
                    game_info['quarter_scores'][team_name] = dict(zip(headers[1:], scores))
    
    return game_info

def scrape_detailed_boxscore(soup):
    """Extract detailed player statistics from Boxscore div"""
    
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
                
            # Extract team name and stat category
            title_text = team_title.get_text().strip()
            parts = title_text.split(' ')
            team_name = ' '.join(parts[:-1])
            stat_category = parts[-1].lower()
            
            # Initialize team data
            if team_name not in teams_data:
                teams_data[team_name] = {}
            if stat_category not in teams_data[team_name]:
                teams_data[team_name][stat_category] = {}
            
            # Extract player stats
            player_stats = extract_player_stats(team, stat_category)
            teams_data[team_name][stat_category] = player_stats
    
    return teams_data

def extract_player_stats(team_section, stat_category):
    """Extract individual player statistics from a team section"""
    
    stats = {
        'players': [],
        'team_totals': {}
    }
    
    # Find the responsive table
    table_section = team_section.find('div', class_='ResponsiveTable')
    if not table_section:
        # Check for empty stats message
        empty_table = team_section.find('table', class_='EmptyBoxScore__Table')
        if empty_table:
            empty_msg = empty_table.find('td', class_='Empty__Message')
            if empty_msg:
                stats['message'] = empty_msg.get_text().strip()
        return stats
    
    # Get headers from the scrollable table
    scroller = table_section.find('div', class_='Table__Scroller')
    if not scroller:
        return stats
        
    headers = []
    header_rows = scroller.find_all('tr', class_='Table__sub-header')
    if header_rows:
        for th in header_rows[-1].find_all('th'):
            header_text = th.get_text().strip()
            if header_text:
                headers.append(header_text)
    
    # Get player names from fixed left table
    fixed_table = table_section.find('table', class_='Table--fixed-left')
    player_names = []
    if fixed_table:
        player_rows = fixed_table.find_all('tr', {'data-idx': True})
        for row in player_rows:
            if 'Boxscore__Totals' not in row.get('class', []):
                athlete_div = row.find('div', class_='Boxscore__Athlete')
                if athlete_div:
                    name_link = athlete_div.find('a', class_='Boxscore__Athlete_Name')
                    jersey_span = athlete_div.find('span', class_='Boxscore__Athlete_Jersey')
                    
                    player_info = {}
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
    
    # Get stats from scrollable table
    stat_rows = scroller.find_all('tr', class_=['Table__TR', 'Table__TR--sm', 'Table__even'])
    
    player_index = 0
    for row in stat_rows:
        if 'Boxscore__Totals' in row.get('class', []):
            # Team totals row
            stat_cells = row.find_all('td', class_='Table__TD')
            if stat_cells and headers:
                totals = {}
                for j, cell in enumerate(stat_cells):
                    if j < len(headers):
                        totals[headers[j]] = cell.get_text().strip()
                stats['team_totals'] = totals
        else:
            # Player stat row
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

def save_comprehensive_data(game_data, filename=None):
    """Save comprehensive game data to JSON file"""
    if not filename:
        filename = f"comprehensive_boxscore_{game_data['game_id']}.json"
    
    with open(filename, 'w') as f:
        json.dump(game_data, f, indent=2)
    print(f"Saved comprehensive data to {filename}")

def print_game_summary(game_data):
    """Print a summary of the scraped game data"""
    print(f"\nGame ID: {game_data['game_id']}")
    print("=" * 60)
    
    # Game info summary
    game_info = game_data.get('game_info', {})
    teams = game_info.get('teams', [])
    
    if len(teams) >= 2:
        print(f"\n{teams[0].get('short_name', 'Team 1')} vs {teams[1].get('short_name', 'Team 2')}")
        print(f"Score: {teams[0].get('current_score', '0')} - {teams[1].get('current_score', '0')}")
        
        status = game_info.get('game_status', {})
        if status:
            print(f"Status: {status.get('time_remaining', '')} - {status.get('quarter', '')}")
    
    # Quarter scores
    quarter_scores = game_info.get('quarter_scores', {})
    if quarter_scores:
        print("\nQuarter by Quarter:")
        for team, scores in quarter_scores.items():
            print(f"{team}: {scores}")
    
    # Team stats summary
    print("\nDetailed Statistics:")
    for team_name, team_stats in game_data.get('teams', {}).items():
        print(f"\n{team_name}:")
        for category, stats in team_stats.items():
            if 'players' in stats and stats['players']:
                print(f"  {category.upper()}: {len(stats['players'])} players")
            elif 'message' in stats:
                print(f"  {category.upper()}: {stats['message']}")

def main():
    game_id = input("Enter ESPN Game ID: ").strip()
    
    if not game_id:
        print("Using example Game ID: 401754546")
        game_id = "401754546"
    
    print(f"Scraping comprehensive data for Game ID: {game_id}")
    
    # Scrape the data
    game_data = scrape_comprehensive_boxscore(game_id)
    
    if game_data:
        # Print summary
        print_game_summary(game_data)
        
        # Save to file
        save_comprehensive_data(game_data)
        
        return game_data
    else:
        print("Failed to scrape game data")
        return None

if __name__ == "__main__":
    main()