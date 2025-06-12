import requests
from base64 import b64encode
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

def get_ebay_access_token() -> str:
    """Get eBay OAuth access token using client credentials"""
    CLIENT_ID = os.getenv('EBAY_CLIENT_ID')
    CLIENT_SECRET = os.getenv('EBAY_CLIENT_SECRET')
    
    if not CLIENT_ID or not CLIENT_SECRET:
        raise ValueError("eBay API credentials not found in environment variables")
    
    auth = b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {auth}"
    }
    
    data = {
        "grant_type": "client_credentials",
        "scope": "https://api.ebay.com/oauth/api_scope"
    }
    
    response = requests.post("https://api.ebay.com/identity/v1/oauth2/token", headers=headers, data=data)
    response.raise_for_status()
    
    return response.json()["access_token"]

def search_ebay_items(item_name: str, days_back: int = 7, limit: int = 100) -> Dict:
    """
    Search eBay for active listings matching the given name
    
    Args:
        item_name: The item name to search for (e.g., "tommy hilfiger shirt")
        days_back: Number of days back to search (not used for active listings, kept for API compatibility)
        limit: Maximum number of items to return (default: 100)
    
    Returns:
        Dictionary containing item summaries and analysis
    """
    access_token = get_ebay_access_token()
    
    # Build the request
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=US"
    }
    
    # Clean the item name for URL encoding
    search_query = "+".join(item_name.split())
    
    url = (
        "https://api.ebay.com/buy/browse/v1/item_summary/search"
        f"?q={search_query}"
        f"&limit={limit}"
    )
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    items = data.get("itemSummaries", [])
    
    # Calculate average price and other statistics
    if items:
        prices = []
        valid_items = []
        
        for item in items:
            price_info = item.get("price", {})
            if price_info and "value" in price_info:
                try:
                    price = float(price_info["value"])
                    prices.append(price)
                    # Extract image URL from thumbnailImages (better quality than image.imageUrl)
                    thumbnail_images = item.get("thumbnailImages", [])
                    image_url = thumbnail_images[0].get("imageUrl", "") if thumbnail_images else ""
                    
                    valid_items.append({
                        "title": item.get("title", ""),
                        "price": price,
                        "currency": price_info.get("currency", "USD"),
                        "url": item.get("itemWebUrl", ""),
                        "soldDate": item.get("lastItemModificationDate", ""),
                        "imageUrl": image_url
                    })
                except (ValueError, TypeError):
                    continue
        
        if prices:
            average_price = sum(prices) / len(prices)
            min_price = min(prices)
            max_price = max(prices)
            median_price = sorted(prices)[len(prices) // 2]
            
            return {
                "query": item_name,
                "search_period_days": days_back,
                "total_items_found": len(valid_items),
                "requested_limit": limit,
                "statistics": {
                    "average_price": round(average_price, 2),
                    "min_price": round(min_price, 2),
                    "max_price": round(max_price, 2),
                    "median_price": round(median_price, 2),
                    "currency": valid_items[0]["currency"] if valid_items else "USD"
                },
                "items": valid_items[:20],  # Return first 20 items for display
                "date_range": {
                    "start_date": "N/A (active listings)",
                    "end_date": "N/A (active listings)"
                }
            }
    
    return {
        "query": item_name,
        "search_period_days": days_back,
        "total_items_found": 0,
        "requested_limit": limit,
        "statistics": None,
        "items": [],
        "date_range": {
            "start_date": "N/A (active listings)",
            "end_date": "N/A (active listings)"
        },
        "message": "No items found for this search query"
    }

# Example usage (for testing)
if __name__ == "__main__":
    try:
        result = search_ebay_items("calvin klein jeans", days_back=7, limit=100)
        print("eBay Search Results:")
        print(f"Query: {result['query']}")
        print(f"Items found: {result['total_items_found']}")
        
        if result['statistics']:
            stats = result['statistics']
            print(f"Average price: ${stats['average_price']} {stats['currency']}")
            print(f"Price range: ${stats['min_price']} - ${stats['max_price']} {stats['currency']}")
            print(f"Median price: ${stats['median_price']} {stats['currency']}")
        else:
            print(result.get('message', 'No results found'))
            
    except Exception as e:
        print(f"Error: {e}")