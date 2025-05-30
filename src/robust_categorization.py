import asyncio
import openai
from openai import AsyncOpenAI
import pandas as pd
import re
import json
from typing import List, Tuple, Dict, Optional
import time
from collections import defaultdict

class RobustCategoryGenerator:
    def __init__(self, openai_api_key: str):
        self.client = AsyncOpenAI(api_key=openai_api_key)
        
        # Define valid categories and subcategories
        self.valid_categories = {
            "Clothing": [
                "Dresses", "Tops", "Bottoms", "Outerwear", "Activewear", "Sleepwear", 
                "Underwear", "Swimwear", "Accessories", "Uniforms", "Costumes"
            ],
            "Footwear": [
                "Athletic Shoes", "Casual Shoes", "Dress Shoes", "Boots", "Sandals", 
                "Heels", "Flats", "Slippers", "Specialty Footwear"
            ],
            "Beauty": [
                "Makeup", "Skincare", "Hair Care", "Fragrances", "Nail Care", 
                "Bath & Body", "Tools & Accessories", "Men's Grooming"
            ],
            "Electronics": [
                "Mobile Phones", "Computers", "Audio & Video", "Gaming", "Cameras", 
                "Wearables", "Smart Home", "Accessories", "Components"
            ],
            "Home & Garden": [
                "Furniture", "Decor", "Kitchen & Dining", "Bedding & Bath", "Storage", 
                "Lighting", "Garden & Outdoor", "Cleaning Supplies", "Tools"
            ],
            "Sports & Outdoors": [
                "Exercise Equipment", "Outdoor Gear", "Sports Equipment", "Athletic Wear", 
                "Water Sports", "Winter Sports", "Team Sports", "Fitness Accessories"
            ],
            "Toys & Games": [
                "Action Figures", "Dolls", "Board Games", "Educational Toys", "Electronic Toys", 
                "Outdoor Toys", "Arts & Crafts", "Collectibles", "Baby Toys"
            ],
            "Books & Media": [
                "Books", "Movies & TV", "Music", "Video Games", "Magazines", 
                "Educational Materials", "Digital Media"
            ],
            "Automotive": [
                "Parts & Accessories", "Tools & Equipment", "Car Care", "Electronics", 
                "Interior Accessories", "Exterior Accessories", "Tires & Wheels"
            ],
            "Health & Personal Care": [
                "Vitamins & Supplements", "Medical Supplies", "Personal Care", "Oral Care", 
                "Vision Care", "First Aid", "Mobility Aids"
            ],
            "Jewelry & Watches": [
                "Fine Jewelry", "Fashion Jewelry", "Watches", "Accessories", 
                "Wedding & Engagement", "Men's Jewelry"
            ],
            "Baby & Kids": [
                "Baby Clothing", "Baby Gear", "Diapers & Feeding", "Toys", 
                "Kids Clothing", "Kids Furniture", "Safety Products"
            ]
        }
        
        # Create lookup for fuzzy matching
        self.category_lookup = {}
        for category, subcategories in self.valid_categories.items():
            self.category_lookup[category.lower()] = category
            for subcat in subcategories:
                self.category_lookup[subcat.lower()] = (category, subcat)
    
    def get_structured_prompt(self, title: str) -> List[Dict]:
        """Create a structured prompt that enforces format compliance"""
        
        # Create category options string
        category_options = []
        for category, subcategories in self.valid_categories.items():
            subcat_list = ", ".join(subcategories[:5])  # Show first 5 subcategories
            category_options.append(f"- {category}: {subcat_list}...")
        
        category_text = "\n".join(category_options)
        
        return [
            {
                "role": "system", 
                "content": f"""You are a product categorization expert. You MUST categorize products using ONLY the predefined categories and subcategories provided.

STRICT FORMAT REQUIREMENT:
- Output format: Category|Subcategory
- Use ONLY categories and subcategories from the provided list
- If uncertain, choose the closest match
- NEVER create new categories or subcategories
- NEVER include explanations, just the category pair

VALID CATEGORIES:
{category_text}

Examples:
- Nike Air Max Running Shoes → Footwear|Athletic Shoes
- Samsung Galaxy Phone → Electronics|Mobile Phones  
- Levi's Jeans → Clothing|Bottoms
- MAC Lipstick → Beauty|Makeup"""
            },
            {
                "role": "user", 
                "content": f"Categorize this product (format: Category|Subcategory): {title}"
            }
        ]
    
    def parse_and_validate_response(self, response_text: str, title: str) -> Tuple[str, str, bool]:
        """
        Parse OpenAI response and validate against known categories
        Returns: (category, subcategory, is_valid)
        """
        
        # Clean the response
        cleaned = response_text.strip()
        
        # Remove common prefixes/suffixes
        prefixes_to_remove = [
            "category:", "category ", "answer:", "result:", 
            "the category is", "this product is", "product:"
        ]
        
        for prefix in prefixes_to_remove:
            if cleaned.lower().startswith(prefix):
                cleaned = cleaned[len(prefix):].strip()
        
        # Extract category|subcategory pattern
        patterns = [
            r'([A-Za-z\s&]+)\|([A-Za-z\s&]+)',  # Category|Subcategory
            r'([A-Za-z\s&]+):\s*([A-Za-z\s&]+)',  # Category: Subcategory
            r'([A-Za-z\s&]+)\s*-\s*([A-Za-z\s&]+)',  # Category - Subcategory
            r'([A-Za-z\s&]+)\s*>\s*([A-Za-z\s&]+)',  # Category > Subcategory
        ]
        
        for pattern in patterns:
            match = re.search(pattern, cleaned)
            if match:
                category = match.group(1).strip()
                subcategory = match.group(2).strip()
                
                # Validate and correct the categories
                validated_category, validated_subcategory = self.validate_and_correct_categories(
                    category, subcategory, title
                )
                
                if validated_category and validated_subcategory:
                    return validated_category, validated_subcategory, True
        
        # If no pattern matched, try to extract single category and assign default subcategory
        single_category = self.extract_single_category(cleaned, title)
        if single_category:
            default_subcat = self.valid_categories[single_category][0]  # First subcategory
            return single_category, default_subcat, False
        
        # Complete fallback
        return self.get_fallback_category(title)
    
    def validate_and_correct_categories(self, category: str, subcategory: str, title: str) -> Tuple[Optional[str], Optional[str]]:
        """Validate categories against known lists and correct if needed"""
        
        # Clean inputs
        category = category.strip().title()
        subcategory = subcategory.strip().title()
        
        # Check if category exists exactly
        if category in self.valid_categories:
            # Check if subcategory exists for this category
            if subcategory in self.valid_categories[category]:
                return category, subcategory
            else:
                # Find closest subcategory match
                best_subcat = self.find_closest_subcategory(subcategory, category)
                return category, best_subcat
        
        # Try fuzzy matching for category
        best_category = self.find_closest_category(category)
        if best_category:
            # Find best subcategory for the corrected category
            best_subcat = self.find_closest_subcategory(subcategory, best_category)
            return best_category, best_subcat
        
        return None, None
    
    def find_closest_category(self, category: str) -> Optional[str]:
        """Find closest matching category using fuzzy logic"""
        category_lower = category.lower()
        
        # Exact match
        if category_lower in self.category_lookup:
            result = self.category_lookup[category_lower]
            if isinstance(result, str):
                return result
        
        # Partial matches
        for key, value in self.category_lookup.items():
            if isinstance(value, str):  # This is a category
                if category_lower in key or key in category_lower:
                    return value
        
        # Keyword matching
        keyword_mapping = {
            "cloth": "Clothing", "apparel": "Clothing", "fashion": "Clothing",
            "shoe": "Footwear", "boot": "Footwear", "sneaker": "Footwear",
            "makeup": "Beauty", "cosmetic": "Beauty", "skincare": "Beauty",
            "electronic": "Electronics", "tech": "Electronics", "gadget": "Electronics",
            "furniture": "Home & Garden", "decor": "Home & Garden", "kitchen": "Home & Garden",
            "sport": "Sports & Outdoors", "fitness": "Sports & Outdoors", "exercise": "Sports & Outdoors",
            "toy": "Toys & Games", "game": "Toys & Games", "doll": "Toys & Games",
            "book": "Books & Media", "movie": "Books & Media", "music": "Books & Media",
            "car": "Automotive", "auto": "Automotive", "vehicle": "Automotive",
            "health": "Health & Personal Care", "medical": "Health & Personal Care",
            "jewelry": "Jewelry & Watches", "watch": "Jewelry & Watches", "ring": "Jewelry & Watches",
            "baby": "Baby & Kids", "kid": "Baby & Kids", "infant": "Baby & Kids"
        }
        
        for keyword, mapped_category in keyword_mapping.items():
            if keyword in category_lower:
                return mapped_category
        
        return None
    
    def find_closest_subcategory(self, subcategory: str, category: str) -> str:
        """Find closest matching subcategory within a category"""
        subcategory_lower = subcategory.lower()
        valid_subcats = self.valid_categories[category]
        
        # Exact match
        for subcat in valid_subcats:
            if subcategory_lower == subcat.lower():
                return subcat
        
        # Partial match
        for subcat in valid_subcats:
            if subcategory_lower in subcat.lower() or subcat.lower() in subcategory_lower:
                return subcat
        
        # Return first subcategory as default
        return valid_subcats[0]
    
    def extract_single_category(self, text: str, title: str) -> Optional[str]:
        """Extract category from text that doesn't follow the pipe format"""
        text_lower = text.lower()
        
        # Check if any valid category is mentioned
        for category in self.valid_categories.keys():
            if category.lower() in text_lower:
                return category
        
        return None
    
    def get_fallback_category(self, title: str) -> Tuple[str, str, bool]:
        """Get fallback category based on title keywords"""
        title_lower = title.lower()
        
        # Define keyword mappings for fallback
        fallback_rules = [
            (["dress", "shirt", "pants", "jacket", "coat", "sweater", "blouse"], ("Clothing", "Tops")),
            (["shoe", "boot", "sneaker", "sandal", "heel"], ("Footwear", "Casual Shoes")),
            (["perfume", "cologne", "fragrance", "scent"], ("Beauty", "Fragrances")),
            (["makeup", "lipstick", "foundation", "mascara"], ("Beauty", "Makeup")),
            (["phone", "iphone", "samsung", "mobile"], ("Electronics", "Mobile Phones")),
            (["laptop", "computer", "macbook", "pc"], ("Electronics", "Computers")),
            (["book", "novel", "magazine"], ("Books & Media", "Books")),
            (["watch", "clock", "timepiece"], ("Jewelry & Watches", "Watches")),
            (["ring", "necklace", "bracelet", "earring"], ("Jewelry & Watches", "Fine Jewelry")),
            (["bag", "purse", "handbag", "backpack"], ("Clothing", "Accessories")),
        ]
        
        for keywords, (category, subcategory) in fallback_rules:
            if any(keyword in title_lower for keyword in keywords):
                return category, subcategory, False
        
        # Ultimate fallback
        return "Clothing", "Accessories", False
    
    async def get_category_with_retries(self, title: str, max_retries: int = 3) -> Tuple[str, str, bool, int]:
        """
        Get category with retries for invalid responses
        Returns: (category, subcategory, is_valid, attempts_used)
        """
        
        for attempt in range(max_retries):
            try:
                messages = self.get_structured_prompt(title)
                
                response = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    temperature=0.1,  # Very low temperature for consistency
                    max_tokens=20,    # Short response
                    top_p=0.1        # Focus on most likely tokens
                )
                
                response_text = response.choices[0].message.content.strip()
                category, subcategory, is_valid = self.parse_and_validate_response(response_text, title)
                
                if is_valid or attempt == max_retries - 1:  # Accept on last attempt even if not valid
                    return category, subcategory, is_valid, attempt + 1
                
                # If not valid, try again with more specific prompt
                await asyncio.sleep(0.1)
                
            except Exception as e:
                if attempt == max_retries - 1:
                    # Final fallback
                    category, subcategory, _ = self.get_fallback_category(title)
                    return category, subcategory, False, attempt + 1
                
                await asyncio.sleep(0.2)
        
        # Should never reach here, but just in case
        category, subcategory, _ = self.get_fallback_category(title)
        return category, subcategory, False, max_retries
    
    async def process_batch_robust(self, titles: List[str], batch_size: int = 10) -> List[Dict]:
        """Process titles with robust error handling and validation"""
        results = []
        
        for i in range(0, len(titles), batch_size):
            batch = titles[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self.get_category_with_retries(title) for title in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for j, result in enumerate(batch_results):
                title = batch[j]
                
                if isinstance(result, Exception):
                    # Fallback for exceptions
                    category, subcategory, _ = self.get_fallback_category(title)
                    results.append({
                        'title': title,
                        'category': category,
                        'subcategory': subcategory,
                        'is_valid': False,
                        'attempts_used': 0,
                        'method': 'exception_fallback'
                    })
                else:
                    category, subcategory, is_valid, attempts = result
                    results.append({
                        'title': title,
                        'category': category,
                        'subcategory': subcategory,
                        'is_valid': is_valid,
                        'attempts_used': attempts,
                        'method': 'openai_api'
                    })
            
            # Progress update
            print(f"Processed {min(i + batch_size, len(titles))}/{len(titles)} products")
            
            # Small delay between batches
            await asyncio.sleep(0.1)
        
        return results
    
    def process_dataframe_robust(self, df: pd.DataFrame, title_column: str = 'Item Title') -> pd.DataFrame:
        """Process dataframe with robust categorization"""
        print(f"Starting robust categorization of {len(df)} products...")
        
        titles = df[title_column].tolist()
        
        # Process with robust method
        start_time = time.time()
        results = asyncio.run(self.process_batch_robust(titles))
        processing_time = time.time() - start_time
        
        # Add results to dataframe
        df['openai_category'] = [r['category'] for r in results]
        df['openai_subcategory'] = [r['subcategory'] for r in results]
        df['categorization_valid'] = [r['is_valid'] for r in results]
        df['categorization_attempts'] = [r['attempts_used'] for r in results]
        df['categorization_method'] = [r['method'] for r in results]
        
        # Print validation statistics
        print(f"\n{'='*60}")
        print("ROBUST CATEGORIZATION RESULTS")
        print(f"{'='*60}")
        print(f"Total products processed: {len(results)}")
        print(f"Processing time: {processing_time:.2f} seconds")
        print(f"Rate: {len(results) / processing_time:.1f} products/second")
        
        valid_count = sum(r['is_valid'] for r in results)
        print(f"Valid categorizations: {valid_count} ({valid_count/len(results)*100:.1f}%)")
        
        # Attempts distribution
        attempt_counts = defaultdict(int)
        for r in results:
            attempt_counts[r['attempts_used']] += 1
        
        print(f"\nAttempts needed:")
        for attempts, count in sorted(attempt_counts.items()):
            print(f"  {attempts} attempt(s): {count} products ({count/len(results)*100:.1f}%)")
        
        # Category distribution
        print(f"\nFinal category distribution:")
        category_counts = df['openai_category'].value_counts()
        for category, count in category_counts.head(10).items():
            print(f"  {category}: {count} products")
        
        # Quality check
        invalid_count = len(results) - valid_count
        if invalid_count > 0:
            print(f"\n⚠️  {invalid_count} products used fallback categorization")
            print("Consider reviewing these manually or improving the fallback rules.")
        else:
            print(f"\n✅ All products successfully categorized with valid format!")
        
        return df

# Usage function
def robust_category_generation(df: pd.DataFrame, openai_api_key: str) -> pd.DataFrame:
    """
    Main function for robust category generation
    """
    generator = RobustCategoryGenerator(openai_api_key)
    return generator.process_dataframe_robust(df)

# Example usage and testing
if __name__ == "__main__":
    # Test the robust categorization
    test_titles = [
        "Nike Air Max Running Shoes",
        "Samsung Galaxy S21 Phone",
        "Levi's 501 Jeans",
        "MAC Ruby Woo Lipstick",
        "Something completely random and unclear",
        "Broken response test",
        "Apple MacBook Pro 13 inch"
    ]
    
    # This would require an API key to run
    print("Robust categorization system ready!")
    print(f"Supports {sum(len(subcats) for subcats in RobustCategoryGenerator('').valid_categories.values())} subcategories")
    print(f"Across {len(RobustCategoryGenerator('').valid_categories)} main categories") 