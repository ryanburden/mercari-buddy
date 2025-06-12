import sys
import os
sys.path.append('src')

# Test the current ebay function to see what it returns
from analyze.ebay_scrape import search_ebay_items
import json

try:
    result = search_ebay_items("calvin klein jeans", days_back=7, limit=2)
    print("=== Current Function Output ===")
    print(json.dumps(result, indent=2))
    
    print("\n=== Image URLs Check ===")
    if result.get('items'):
        for i, item in enumerate(result['items']):
            print(f"Item {i+1}: {item.get('title', 'No title')}")
            print(f"  imageUrl: '{item.get('imageUrl', 'NOT_FOUND')}'")
            print(f"  Available fields: {list(item.keys())}")
            print()
    else:
        print("No items found")
        
except Exception as e:
    print(f"Error: {e}") 