import sys
import os
sys.path.append('src')
from analyze.ebay_scrape import get_ebay_access_token
import requests
import json

def test_ebay_images():
    try:
        access_token = get_ebay_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=US"
        }
        
        # Test 1: Active listings (should have images)
        print("=== TEST 1: Active listings (should have images) ===")
        active_url = "https://api.ebay.com/buy/browse/v1/item_summary/search?q=calvin+klein+jeans&limit=3"
        response = requests.get(active_url, headers=headers)
        data = response.json()
        
        if 'itemSummaries' in data:
            for i, item in enumerate(data['itemSummaries'][:3]):
                print(f"\nItem {i+1}:")
                print(f"  Title: {item.get('title', 'No title')}")
                print(f"  Image field exists: {'image' in item}")
                if 'image' in item:
                    print(f"  Image structure: {item['image']}")
                    print(f"  Image URL: {item['image'].get('imageUrl', 'No imageUrl')}")
                else:
                    print("  No image field found")
                print(f"  Available fields: {list(item.keys())}")
        
        # Test 2: Sold items (current approach)
        print("\n\n=== TEST 2: Sold items (current approach) ===")
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
        end_date = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        sold_url = f"https://api.ebay.com/buy/browse/v1/item_summary/search?q=calvin+klein+jeans&filter=soldDate:[{start_date}..{end_date}]&limit=3"
        response = requests.get(sold_url, headers=headers)
        data = response.json()
        
        if 'itemSummaries' in data:
            for i, item in enumerate(data['itemSummaries'][:3]):
                print(f"\nSold Item {i+1}:")
                print(f"  Title: {item.get('title', 'No title')}")
                print(f"  Image field exists: {'image' in item}")
                if 'image' in item:
                    print(f"  Image structure: {item['image']}")
                    print(f"  Image URL: {item['image'].get('imageUrl', 'No imageUrl')}")
                else:
                    print("  No image field found")
                print(f"  Available fields: {list(item.keys())}")
        else:
            print("No sold items found or API error")
            print(f"Response: {json.dumps(data, indent=2)}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ebay_images() 