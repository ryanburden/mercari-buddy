import requests
import json
import datetime

# Replace with your own eBay App ID
EBAY_APP_ID = "RyanBurd-ecominte-PRD-6f026f6e1-7e0eab28"





def get_sold_items(keyword="wireless earbuds", page=1):
    url = "https://svcs.ebay.com/services/search/FindingService/v1"

    params = {
        "OPERATION-NAME": "findCompletedItems",
        "SERVICE-VERSION": "1.0.0",
        "SECURITY-APPNAME": EBAY_APP_ID,
        "RESPONSE-DATA-FORMAT": "JSON",
        "keywords": keyword,
        "itemFilter(0).name": "SoldItemsOnly",
        "itemFilter(0).value": "true",
        "paginationInput.entriesPerPage": "1",
        "paginationInput.pageNumber": str(page),
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        raise Exception(f"HTTP {response.status_code}: {response.text}")

    try:
        data = response.json()
        items = data["findCompletedItemsResponse"][0]["searchResult"][0].get("item", [])
        return [{
            "title": item["title"][0],
            "price": item["sellingStatus"][0]["currentPrice"][0]["__value__"],
            "currency": item["sellingStatus"][0]["currentPrice"][0]["@currencyId"],
            "end_time": item["listingInfo"][0]["endTime"][0]
        } for item in items]
    except Exception as e:
        print("❌ Error parsing eBay response:")
        print(data)
        raise e

# Run the function
sold_items = get_sold_items("vintage t-shirt")
for item in sold_items:
    print(f"{item['title']} — {item['price']} {item['currency']} — {item['end_time']}")
