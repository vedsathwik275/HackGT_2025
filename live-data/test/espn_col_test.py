import requests
from bs4 import BeautifulSoup
import re
import json

def scrape_espn_boxscores(url="https://www.espn.com/college-football/scoreboard"):
    """Scrape ESPN college football box score links and game IDs"""
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        # Fetch the page
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find box score links
        box_score_links = soup.find_all('a', href=re.compile(r'/college-football/boxscore/_/gameId/\d+'))
        
        results = []
        for link in box_score_links:
            href = link.get('href')
            game_id = extract_game_id(href)
            
            if game_id:
                results.append({
                    'game_id': game_id,
                    'href': href,
                    'full_url': f'https://www.espn.com{href}',
                    'link_text': link.get_text().strip()
                })
        
        return results
        
    except requests.RequestException as e:
        print(f"Error fetching page: {e}")
        return []

def extract_game_id(href):
    """Extract game ID from href"""
    match = re.search(r'gameId/(\d+)', href)
    return match.group(1) if match else None

def save_to_file(data, filename='boxscores.json'):
    """Save results to JSON file"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(data)} results to {filename}")

def main():
    print("Scraping ESPN college football box scores...")
    
    # Scrape the data
    results = scrape_espn_boxscores()
    
    # Print results
    print(f"\nFound {len(results)} box score links:")
    print("-" * 50)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. Game ID: {result['game_id']}")
        print(f"   Text: {result['link_text']}")
        print(f"   URL: {result['full_url']}")
        print()
    
    # Save to file
    if results:
        save_to_file(results)
    
    return results

if __name__ == "__main__":
    main()