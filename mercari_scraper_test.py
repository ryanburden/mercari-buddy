import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin
import re

class MercariScraper:
    def __init__(self):
        self.session = requests.Session()
        # Set a realistic user agent to avoid being blocked
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def scrape_user_profile(self, profile_url):
        """
        Scrape a Mercari user profile to extract product listings
        """
        try:
            print(f"Fetching: {profile_url}")
            response = self.session.get(profile_url, timeout=10)
            response.raise_for_status()
            
            print(f"Status Code: {response.status_code}")
            print(f"Content Length: {len(response.content)}")
            
            # Parse the HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Check if we got blocked or redirected
            if "blocked" in response.text.lower() or "captcha" in response.text.lower():
                print("⚠️  Possible blocking detected")
                return None
            
            # Extract basic profile info
            profile_info = self.extract_profile_info(soup)
            
            # Extract product listings
            products = self.extract_products(soup)
            
            # Look for API endpoints or data in script tags
            api_data = self.extract_api_data(soup)
            
            return {
                'profile_info': profile_info,
                'products': products,
                'api_data': api_data,
                'page_title': soup.title.string if soup.title else 'No title',
                'html_sample': str(soup)[:1000] + "..." if len(str(soup)) > 1000 else str(soup)
            }
            
        except requests.RequestException as e:
            print(f"❌ Request error: {e}")
            return None
        except Exception as e:
            print(f"❌ Parsing error: {e}")
            return None
    
    def extract_profile_info(self, soup):
        """Extract basic profile information"""
        profile_info = {}
        
        # Try to find profile name
        name_selectors = [
            'h1', '.profile-name', '.user-name', '[data-testid="user-name"]',
            '.seller-name', '.profile-header h1', '.username'
        ]
        
        for selector in name_selectors:
            element = soup.select_one(selector)
            if element:
                profile_info['name'] = element.get_text(strip=True)
                break
        
        # Try to find follower/following counts
        stats_elements = soup.find_all(text=re.compile(r'\d+\s*(followers?|following)', re.I))
        if stats_elements:
            profile_info['stats'] = [elem.strip() for elem in stats_elements]
        
        return profile_info
    
    def extract_products(self, soup):
        """Extract product listings from the page"""
        products = []
        
        # Common selectors for product containers
        product_selectors = [
            '.item', '.product', '.listing', '.card', '[data-testid="item"]',
            '.grid-item', '.product-card', '.merchandise-item'
        ]
        
        for selector in product_selectors:
            product_elements = soup.select(selector)
            if product_elements:
                print(f"Found {len(product_elements)} potential products with selector: {selector}")
                
                for element in product_elements[:5]:  # Limit to first 5 for testing
                    product = self.extract_product_info(element)
                    if product:
                        products.append(product)
                break
        
        return products
    
    def extract_product_info(self, element):
        """Extract information from a single product element"""
        product = {}
        
        # Try to extract title
        title_selectors = ['h3', 'h4', '.title', '.name', '.product-name', 'a[title]']
        for selector in title_selectors:
            title_elem = element.select_one(selector)
            if title_elem:
                product['title'] = title_elem.get_text(strip=True)
                break
        
        # Try to extract price
        price_selectors = ['.price', '.cost', '.amount', '[data-testid="price"]']
        for selector in price_selectors:
            price_elem = element.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                # Extract numeric price
                price_match = re.search(r'\$?(\d+(?:,\d{3})*(?:\.\d{2})?)', price_text)
                if price_match:
                    product['price'] = price_match.group(1)
                break
        
        # Try to extract image URL
        img_elem = element.select_one('img')
        if img_elem:
            product['image_url'] = img_elem.get('src') or img_elem.get('data-src')
        
        # Try to extract product URL
        link_elem = element.select_one('a')
        if link_elem:
            product['product_url'] = link_elem.get('href')
        
        return product if product else None
    
    def extract_api_data(self, soup):
        """Look for JSON data in script tags that might contain API responses"""
        api_data = {}
        
        # Look for JSON in script tags
        script_tags = soup.find_all('script')
        for script in script_tags:
            if script.string:
                # Look for JSON-like structures
                if 'window.__INITIAL_STATE__' in script.string:
                    api_data['initial_state'] = 'Found window.__INITIAL_STATE__'
                elif 'window.__PRELOADED_STATE__' in script.string:
                    api_data['preloaded_state'] = 'Found window.__PRELOADED_STATE__'
                elif '"items"' in script.string and '"price"' in script.string:
                    api_data['items_data'] = 'Found items data in script'
        
        return api_data

def test_mercari_scraping():
    """Test the Mercari scraping functionality"""
    scraper = MercariScraper()
    
    # Test URL
    test_url = "https://www.mercari.com/u/beccoh/"
    
    print("🔍 Testing Mercari Profile Scraping")
    print("=" * 50)
    
    # Scrape the profile
    result = scraper.scrape_user_profile(test_url)
    
    if result:
        print("\n✅ Scraping successful!")
        print(f"📄 Page Title: {result['page_title']}")
        
        if result['profile_info']:
            print(f"\n👤 Profile Info:")
            for key, value in result['profile_info'].items():
                print(f"   {key}: {value}")
        
        if result['products']:
            print(f"\n🛍️  Found {len(result['products'])} products:")
            for i, product in enumerate(result['products'], 1):
                print(f"\n   Product {i}:")
                for key, value in product.items():
                    print(f"     {key}: {value}")
        else:
            print("\n❌ No products found")
        
        if result['api_data']:
            print(f"\n🔧 API Data Found:")
            for key, value in result['api_data'].items():
                print(f"   {key}: {value}")
        
        print(f"\n📝 HTML Sample (first 500 chars):")
        print(result['html_sample'][:500])
        
        # Save full result to file for inspection
        with open('mercari_scrape_result.json', 'w') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Full result saved to 'mercari_scrape_result.json'")
        
    else:
        print("\n❌ Scraping failed")

if __name__ == "__main__":
    test_mercari_scraping() 