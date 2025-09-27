#!/usr/bin/env python3
"""
Test script for Smart Cache Manager
"""
import time
from smart_cache_manager import get_smart_espn_data, smart_cache

def test_smart_cache():
    """Test the smart caching functionality"""
    print("🧪 Testing Smart Cache Manager")
    print("=" * 50)
    
    # Test 1: Initial data load (should trigger full refresh)
    print("\n📋 Test 1: Initial data load")
    print("-" * 30)
    
    start_time = time.time()
    data1 = get_smart_espn_data("college football games")
    load_time1 = time.time() - start_time
    
    print(f"✅ Got {data1.get('total_games', 0)} games in {load_time1:.2f}s")
    
    cache_status = smart_cache.get_cache_status()
    print(f"📊 Cache status: {cache_status}")
    
    # Test 2: Player-specific query (should use cache + selective update)
    print("\n🏈 Test 2: Player-specific query (Haynes King)")
    print("-" * 30)
    
    start_time = time.time()
    data2 = get_smart_espn_data("Haynes King stats")
    load_time2 = time.time() - start_time
    
    print(f"✅ Got {data2.get('total_games', 0)} games in {load_time2:.2f}s")
    
    # Check if Haynes King was found
    haynes_games = smart_cache.find_player_games("Haynes King")
    print(f"🔍 Haynes King found in games: {haynes_games}")
    
    cache_status = smart_cache.get_cache_status()
    print(f"📊 Cache status: {cache_status}")
    
    # Test 3: Same query again (should be very fast)
    print("\n⚡ Test 3: Repeat query (should be cached)")
    print("-" * 30)
    
    start_time = time.time()
    data3 = get_smart_espn_data("Haynes King passing yards")
    load_time3 = time.time() - start_time
    
    print(f"✅ Got {data3.get('total_games', 0)} games in {load_time3:.2f}s")
    print(f"⚡ Speed improvement: {load_time1/load_time3:.1f}x faster")
    
    # Test 4: Different player query
    print("\n🏈 Test 4: Different player query")
    print("-" * 30)
    
    start_time = time.time()
    data4 = get_smart_espn_data("Jordan Travis stats")
    load_time4 = time.time() - start_time
    
    print(f"✅ Got {data4.get('total_games', 0)} games in {load_time4:.2f}s")
    
    travis_games = smart_cache.find_player_games("Jordan Travis")
    print(f"🔍 Jordan Travis found in games: {travis_games}")
    
    # Final cache status
    print("\n📊 Final Cache Status:")
    print("-" * 30)
    final_status = smart_cache.get_cache_status()
    for key, value in final_status.items():
        print(f"  {key}: {value}")
    
    print("\n✅ Smart cache test completed!")
    return True

def test_cache_expiry():
    """Test cache expiry functionality (requires waiting)"""
    print("\n⏰ Testing cache expiry (this will take a few minutes)...")
    print("=" * 50)
    
    # Get initial data
    data1 = get_smart_espn_data("test query")
    print(f"📊 Initial: {data1.get('total_games', 0)} games")
    
    print("⏳ Waiting 3 minutes to test individual game expiry...")
    print("   (In real usage, you'd just continue using the system)")
    
    # In a real test, you'd wait 3+ minutes here
    # For demo purposes, we'll simulate by manually expiring cache
    print("🔧 Simulating cache expiry...")
    
    # Manually expire individual game cache
    for game_id in smart_cache.game_cache:
        smart_cache.game_cache[game_id]['timestamp'] = smart_cache.game_cache[game_id]['timestamp'].replace(minute=0)
    
    data2 = get_smart_espn_data("Haynes King stats")
    print(f"📊 After expiry: {data2.get('total_games', 0)} games")
    print("✅ Cache expiry test completed!")

if __name__ == "__main__":
    # Run basic functionality test
    test_smart_cache()
    
    # Optionally test cache expiry
    run_expiry_test = input("\n❓ Run cache expiry test? (y/n): ").lower() == 'y'
    if run_expiry_test:
        test_cache_expiry()
