from data_parser import parse_data
import openai
from openai import AsyncOpenAI
import time
import pandas as pd
import os
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key from environment variable
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

class RateLimiter:
    """Rate limiter to manage API request frequency"""
    def __init__(self, max_requests_per_minute=50):
        self.max_requests_per_minute = max_requests_per_minute
        self.requests = []
        self.lock = asyncio.Lock()
    
    async def wait_if_needed(self):
        async with self.lock:
            now = time.time()
            # Remove requests older than 1 minute
            self.requests = [req_time for req_time in self.requests if now - req_time < 60]
            
            if len(self.requests) >= self.max_requests_per_minute:
                # Wait until the oldest request is more than 1 minute old
                sleep_time = 60 - (now - self.requests[0]) + 0.1  # Add small buffer
                if sleep_time > 0:
                    print(f"Rate limit reached, waiting {sleep_time:.1f} seconds...")
                    await asyncio.sleep(sleep_time)
                    # Clean up old requests again after waiting
                    now = time.time()
                    self.requests = [req_time for req_time in self.requests if now - req_time < 60]
            
            self.requests.append(now)

def normalize_titles(df, column_name):
    # Remove leading and trailing whitespace and convert to lowercase
    product_titles = [title.strip().lower() for title in df[column_name]]
    return product_titles

def extract_day_of_week(date):
    """Extract day of the week from a date"""
    try:
        if pd.isna(date):
            return "Unknown"
        return date.strftime('%A')  # Returns full day name (e.g., 'Monday', 'Tuesday')
    except:
        return "Unknown"

def extract_season(date):
    """Extract season from a date based on month"""
    try:
        if pd.isna(date):
            return "Unknown"
        
        month = date.month
        
        if month in [12, 1, 2]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Spring"
        elif month in [6, 7, 8]:
            return "Summer"
        elif month in [9, 10, 11]:
            return "Fall"
        else:
            return "Unknown"
    except:
        return "Unknown"

def add_temporal_features(df):
    """Add day of week and season columns based on Sold Date"""
    print("Adding temporal features...")
    
    # Ensure Sold Date is in datetime format
    df['Sold Date'] = pd.to_datetime(df['Sold Date'])
    
    # Extract day of the week
    df['day_of_week'] = df['Sold Date'].apply(extract_day_of_week)
    
    # Extract season
    df['season'] = df['Sold Date'].apply(extract_season)
    
    print(f"Day of week distribution:")
    print(df['day_of_week'].value_counts())
    print(f"\nSeason distribution:")
    print(df['season'].value_counts())
    
    return df

async def get_openai_categories(title, client=None):
    # Use provided client or create a new one
    if client is None:
        client = AsyncOpenAI(api_key=openai_api_key)
        should_close = True
    else:
        should_close = False
        
    try:
        # Define the JSON schema for structured output
        categorization_schema = {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "The main product category (e.g., 'Clothing', 'Electronics', 'Beauty')"
                },
                "subcategory": {
                    "type": "string", 
                    "description": "The specific subcategory within the main category (e.g., 'T-Shirts', 'Smartphones', 'Skincare')"
                }
            },
            "required": ["category", "subcategory"],
            "additionalProperties": False
        }
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # Use gpt-4o-mini for structured outputs (cheaper than gpt-4o)
            messages=[
                {
                    "role": "system", 
                    "content": """You are a product categorization expert. Your task is to categorize product titles into a main category and subcategory.

Guidelines:
- Use broad, standard category names (e.g., 'Clothing', 'Electronics', 'Beauty', 'Home & Kitchen', 'Sports & Outdoors')
- Choose specific, descriptive subcategories that help sellers understand their product niche
- Be consistent with category naming across similar products
- If unsure, choose the most logical general category

Examples:
- "Nike Air Max Running Shoes" → category: "Footwear", subcategory: "Running Shoes"
- "Samsung 4K Smart TV 55 inch" → category: "Electronics", subcategory: "Televisions"  
- "Organic Cotton T-Shirt" → category: "Clothing", subcategory: "T-Shirts"
- "MAC Lipstick Ruby Red" → category: "Beauty", subcategory: "Makeup"
- "iPhone 13 Pro Case" → category: "Electronics", subcategory: "Phone Accessories"
"""
                },
                {
                    "role": "user", 
                    "content": f"Categorize this product: {title}"
                }
            ],
            temperature=0.1,  # Lower temperature for more consistent categorization
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "product_categorization",
                    "schema": categorization_schema,
                    "strict": True
                }
            }
        )
        
        # Parse the structured JSON response
        result = response.choices[0].message.content
        categorization = json.loads(result)
        
        category = categorization.get("category", "Unknown")
        subcategory = categorization.get("subcategory", "Unknown")
        
        print(f"Structured response for '{title}': {category} | {subcategory}")
        
        return category, subcategory
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error for title '{title}': {str(e)}")
        return "Unknown", "Unknown"
    except Exception as e:
        print(f"Error processing title '{title}': {str(e)}")
        return "Unknown", "Unknown"
    finally:
        # Only close if we created the client
        if should_close and client:
            await client.close()

async def generate_categories(df, api_tier="tier3"):
    """
    Generate categories with configurable rate limits based on OpenAI tier
    
    Args:
        df: DataFrame with product data
        api_tier: "tier1", "tier2", or "tier3" for different rate limits
    """
    # Add temporal features first
    df = add_temporal_features(df)
    
    # Normalize titles
    product_titles = normalize_titles(df, 'Item Title')
    print("Normalized titles: ", product_titles[0:10])
    
    # Configure rate limits based on tier
    tier_configs = {
        "tier1": {"rpm": 2, "concurrent": 1, "batch_size": 10},       # Free tier
        "tier2": {"rpm": 45, "concurrent": 15, "batch_size": 50},     # $5+ tier  
        "tier3": {"rpm": 480, "concurrent": 60, "batch_size": 120},   # $50+ tier (500 RPM confirmed)
        "tier4": {"rpm": 4500, "concurrent": 100, "batch_size": 200}  # $1000+ tier
    }
    
    config = tier_configs.get(api_tier, tier_configs["tier3"])
    print(f"Using {api_tier} configuration: {config['rpm']} RPM, {config['concurrent']} concurrent")
    
    # Generate OpenAI categories with async concurrency and rate limiting
    print("Generating OpenAI categories...")
    
    # Create a single shared client for all requests
    async with AsyncOpenAI(api_key=openai_api_key) as client:
        # Create rate limiter and semaphore based on tier
        rate_limiter = RateLimiter(max_requests_per_minute=config["rpm"])
        semaphore = asyncio.Semaphore(config["concurrent"])
        
        async def categorize_with_limit(title):
            async with semaphore:
                try:
                    await rate_limiter.wait_if_needed()
                    result = await get_openai_categories(title, client)
                    return result
                except Exception as e:
                    print(f"Error categorizing '{title}': {e}")
                    return "Unknown", "Unknown"
        
        # Create tasks for all titles
        tasks = [categorize_with_limit(title) for title in product_titles]
        
        # Execute all tasks concurrently with progress tracking
        print(f"Processing {len(tasks)} products concurrently...")
        start_time = time.time()
        
        # Process in batches to avoid overwhelming the API
        batch_size = config["batch_size"]
        all_results = []
        
        for i in range(0, len(tasks), batch_size):
            batch = tasks[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1}/{(len(tasks) + batch_size - 1)//batch_size} ({len(batch)} items)")
            batch_results = await asyncio.gather(*batch, return_exceptions=True)
            all_results.extend(batch_results)
            
            # Minimal delay between batches for tier3
            if i + batch_size < len(tasks):
                delay = 0.2 if api_tier == "tier3" else (0.5 if api_tier == "tier4" else 1.0)
                await asyncio.sleep(delay)
        
        end_time = time.time()
        print(f"Completed categorization in {end_time - start_time:.2f} seconds")
        print(f"Average processing rate: {len(tasks) / (end_time - start_time):.1f} products/second")
    
    # Extract categories and subcategories from results
    categories = []
    subcategories = []
    
    for result in all_results:
        if isinstance(result, Exception):
            print(f"Exception occurred: {result}")
            categories.append("Unknown")
            subcategories.append("Unknown")
        elif isinstance(result, tuple) and len(result) == 2:
            categories.append(result[0])
            subcategories.append(result[1])
        else:
            print(f"Unexpected result format: {result}")
            categories.append("Unknown")
            subcategories.append("Unknown")
    
    df['openai_category'] = categories
    df['openai_subcategory'] = subcategories
    print("OpenAI categories added")

    return df

#def gen_subcategories(df):

if __name__ == "__main__":
    # Fix for Windows event loop issues
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    try:
        df = parse_data("data\Custom-sales-report_010117-053025_all.csv")[:-2000]
        
        # Using tier3 settings - confirmed 500 RPM limit
        print("Confirmed: You have 500 RPM limits (Tier 3)")
        print("Using optimized Tier 3 settings for maximum speed...")
        df = asyncio.run(generate_categories(df))  # Default is now tier3
        
        print("\nCategory distribution:")
        print(df['openai_category'].value_counts())
        print("\nSubcategory distribution:")
        print(df['openai_subcategory'].value_counts())
        print("\nDay of week distribution:")
        print(df['day_of_week'].value_counts())
        print("\nSeason distribution:")
        print(df['season'].value_counts())
        
        df.to_csv("data\openai_categories.csv", index=False)
        
    except Exception as e:
        print(f"Error occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Ensure all async resources are cleaned up
        print("Cleaning up...")
        
        # Get the current event loop if it exists
        try:
            loop = asyncio.get_event_loop()
            if not loop.is_closed():
                # Cancel any remaining tasks
                pending = asyncio.all_tasks(loop)
                for task in pending:
                    task.cancel()
                
                # Wait for tasks to complete cancellation
                if pending:
                    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
        except RuntimeError:
            # Event loop doesn't exist or is already closed
            pass

def get_recommended_tier_settings():
    """Helper function showing current tier capabilities"""
    print("Your Current OpenAI Tier Status:")
    print("="*50)
    print("✅ Tier 3 (500 RPM) - CONFIRMED")
    print("⚡ Optimized for: ~30-60 seconds for 2000 products")
    print("🚀 Concurrent requests: 60 simultaneous")
    print("📦 Batch size: 120 products per batch")
    print("\nPerformance expectations:")
    print("- 1000 products: ~15-30 seconds")
    print("- 2000 products: ~30-60 seconds") 
    print("- 5000 products: ~2-3 minutes")
    print("\nNext upgrade (Tier 4 - $1000+): 5000 RPM")
    print("\nFeatures:")
    print("- AI categorization with OpenAI structured outputs")
    print("- Temporal analysis (day of week, season)")
    print("- Fast async processing")
    return "tier3"

