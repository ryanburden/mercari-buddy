import requests
from bs4 import BeautifulSoup
import json
import time
import random
from urllib.parse import urljoin
import re

class AdvancedMercariScraper:
    def __init__(self):
        self.session = requests.Session()
        
        # Use a more realistic browser profile
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        })
    
    def test_basic_access(self, url):
        """Test basic access to see what we get"""
        print(f"🔍 Testing basic access to: {url}")
        
        try:
            # Try direct access first
            response = self.session.get(url, timeout=15)
            print(f"Status Code: {response.status_code}")
            print(f"Content Length: {len(response.content)}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                # Check content type
                content_type = response.headers.get('content-type', '')
                print(f"Content Type: {content_type}")
                
                # Sample of response text
                text_sample = response.text[:500]
                print(f"Response Sample: {text_sample}")
                
                return response
            else:
                print(f"❌ Failed with status code: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def try_with_referrer(self, url):
        """Try accessing with a referrer"""
        print(f"\n🔄 Trying with referrer...")
        
        # First visit the main site
        try:
            main_response = self.session.get("https://www.mercari.com/", timeout=15)
            print(f"Main site status: {main_response.status_code}")
            
            if main_response.status_code == 200:
                # Now try the profile with referrer
                self.session.headers.update({
                    'Referer': 'https://www.mercari.com/'
                })
                
                time.sleep(random.uniform(2, 4))  # Random delay
                
                response = self.session.get(url, timeout=15)
                print(f"Profile with referrer status: {response.status_code}")
                
                if response.status_code == 200:
                    return response
                    
        except Exception as e:
            print(f"❌ Error with referrer: {e}")
        
        return None
    
    def analyze_response(self, response):
        """Analyze the response to see what we can extract"""
        if not response:
            return None
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        analysis = {
            'title': soup.title.string if soup.title else 'No title',
            'meta_tags': [],
            'script_tags_count': len(soup.find_all('script')),
            'has_react_data': False,
            'possible_json_data': [],
            'form_elements': len(soup.find_all('form')),
            'links_count': len(soup.find_all('a')),
            'images_count': len(soup.find_all('img'))
        }
        
        # Check meta tags
        for meta in soup.find_all('meta'):
            if meta.get('name') or meta.get('property'):
                analysis['meta_tags'].append({
                    'name': meta.get('name') or meta.get('property'),
                    'content': meta.get('content', '')[:100]
                })
        
        # Look for React/JavaScript data
        script_tags = soup.find_all('script')
        for script in script_tags:
            if script.string:
                content = script.string
                if 'window.__INITIAL_STATE__' in content:
                    analysis['has_react_data'] = True
                    analysis['possible_json_data'].append('Found window.__INITIAL_STATE__')
                elif 'window.__PRELOADED_STATE__' in content:
                    analysis['has_react_data'] = True
                    analysis['possible_json_data'].append('Found window.__PRELOADED_STATE__')
                elif '"user"' in content and '"items"' in content:
                    analysis['possible_json_data'].append('Found user/items data')
                elif content.strip().startswith('{'):
                    try:
                        # Try to parse as JSON
                        json.loads(content)
                        analysis['possible_json_data'].append('Found valid JSON data')
                    except:
                        pass
        
        # Check for anti-bot indicators
        analysis['anti_bot_indicators'] = []
        text_lower = response.text.lower()
        
        if 'cloudflare' in text_lower:
            analysis['anti_bot_indicators'].append('Cloudflare detected')
        if 'captcha' in text_lower:
            analysis['anti_bot_indicators'].append('CAPTCHA detected')
        if 'blocked' in text_lower:
            analysis['anti_bot_indicators'].append('Blocking message detected')
        if 'access denied' in text_lower:
            analysis['anti_bot_indicators'].append('Access denied message')
        
        return analysis

def test_mercari_access():
    """Comprehensive test of Mercari access methods"""
    scraper = AdvancedMercariScraper()
    test_url = "https://www.mercari.com/u/beccoh/"
    
    print("🚀 Advanced Mercari Scraping Test")
    print("=" * 60)
    
    # Test 1: Basic access
    print("\n📋 Test 1: Basic Access")
    response = scraper.test_basic_access(test_url)
    if response:
        analysis = scraper.analyze_response(response)
        print("\n📊 Response Analysis:")
        for key, value in analysis.items():
            if isinstance(value, list) and value:
                print(f"   {key}: {value}")
            elif not isinstance(value, list):
                print(f"   {key}: {value}")
    
    # Test 2: With referrer  
    print("\n📋 Test 2: Access with Referrer")
    response2 = scraper.try_with_referrer(test_url)
    if response2:
        analysis2 = scraper.analyze_response(response2)
        print("\n📊 Response Analysis (with referrer):")
        for key, value in analysis2.items():
            if isinstance(value, list) and value:
                print(f"   {key}: {value}")
            elif not isinstance(value, list):
                print(f"   {key}: {value}")
    
    # Test 3: Try the main site to understand structure
    print("\n📋 Test 3: Analyzing Main Site Structure")
    main_response = scraper.test_basic_access("https://www.mercari.com/")
    if main_response:
        main_analysis = scraper.analyze_response(main_response)
        print("\n📊 Main Site Analysis:")
        for key, value in main_analysis.items():
            if isinstance(value, list) and value:
                print(f"   {key}: {value}")
            elif not isinstance(value, list):
                print(f"   {key}: {value}")
    
    # Summary and recommendations
    print("\n" + "=" * 60)
    print("📝 SUMMARY & RECOMMENDATIONS")
    print("=" * 60)
    
    if response and response.status_code == 200:
        print("✅ Basic access successful - scraping may be possible")
    elif response and response.status_code == 403:
        print("⚠️  403 Forbidden - Anti-bot protection detected")
        print("💡 Recommendations:")
        print("   • Use rotating proxies")
        print("   • Implement selenium with real browser")
        print("   • Add longer delays between requests")
        print("   • Use residential IP addresses")
        print("   • Implement CAPTCHA solving")
    elif response and response.status_code == 429:
        print("⚠️  429 Rate Limited - Too many requests")
        print("💡 Recommendations:")
        print("   • Implement exponential backoff")
        print("   • Use rotating IP addresses")
        print("   • Reduce request frequency")
    else:
        print("❌ Access failed - Further investigation needed")
    
    print("\n🔧 Alternative Approaches:")
    print("   1. Use Selenium WebDriver with stealth mode")
    print("   2. Implement proxy rotation")
    print("   3. Use mobile user agents")
    print("   4. Try API endpoints (if publicly available)")
    print("   5. Use legitimate browser automation tools")

if __name__ == "__main__":
    test_mercari_access() 