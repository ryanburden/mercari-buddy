import asyncio
import aiohttp
import openai
from openai import AsyncOpenAI
import pandas as pd
import time
import hashlib
import pickle
import os
from typing import List, Tuple, Dict, Optional
from concurrent.futures import ThreadPoolExecutor
import sqlite3
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.cluster import KMeans
from collections import defaultdict
import json

class OptimizedCategoryGenerator:
    def __init__(self, openai_api_key: str, cache_dir: str = "cache"):
        self.client = AsyncOpenAI(api_key=openai_api_key)
        self.sync_client = openai.OpenAI(api_key=openai_api_key)
        self.cache_dir = cache_dir
        self.setup_cache()
        
        # Load local model for pre-filtering
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Category cache for similar products
        self.category_cache = {}
        self.load_category_cache()
    
    def setup_cache(self):
        """Set up SQLite cache for storing API responses"""
        os.makedirs(self.cache_dir, exist_ok=True)
        self.cache_db = os.path.join(self.cache_dir, "category_cache.db")
        
        with sqlite3.connect(self.cache_db) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS category_cache (
                    title_hash TEXT PRIMARY KEY,
                    title TEXT,
                    category TEXT,
                    subcategory TEXT,
                    confidence REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
    
    def get_title_hash(self, title: str) -> str:
        """Generate hash for title to use as cache key"""
        return hashlib.md5(title.lower().strip().encode()).hexdigest()
    
    def get_cached_category(self, title: str) -> Optional[Tuple[str, str]]:
        """Check if we already have a category for this title"""
        title_hash = self.get_title_hash(title)
        
        with sqlite3.connect(self.cache_db) as conn:
            cursor = conn.execute(
                "SELECT category, subcategory FROM category_cache WHERE title_hash = ?",
                (title_hash,)
            )
            result = cursor.fetchone()
            
        if result:
            return result[0], result[1]
        return None
    
    def cache_category(self, title: str, category: str, subcategory: str, confidence: float = 1.0):
        """Cache the category result"""
        title_hash = self.get_title_hash(title)
        
        with sqlite3.connect(self.cache_db) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO category_cache 
                (title_hash, title, category, subcategory, confidence)
                VALUES (?, ?, ?, ?, ?)
            """, (title_hash, title, category, subcategory, confidence))
    
    def load_category_cache(self):
        """Load existing categories into memory for similarity matching"""
        cache_file = os.path.join(self.cache_dir, "category_embeddings.pkl")
        if os.path.exists(cache_file):
            with open(cache_file, 'rb') as f:
                self.category_cache = pickle.load(f)
    
    def save_category_cache(self):
        """Save category cache to disk"""
        cache_file = os.path.join(self.cache_dir, "category_embeddings.pkl")
        with open(cache_file, 'wb') as f:
            pickle.dump(self.category_cache, f)
    
    def find_similar_category(self, title: str, threshold: float = 0.85) -> Optional[Tuple[str, str]]:
        """Find similar cached products using semantic similarity"""
        if not self.category_cache:
            return None
        
        # Get embedding for current title
        title_embedding = self.sentence_model.encode([title])[0]
        
        # Find most similar cached title
        best_similarity = 0
        best_category = None
        
        for cached_title, (category, subcategory, embedding) in self.category_cache.items():
            similarity = np.dot(title_embedding, embedding) / (
                np.linalg.norm(title_embedding) * np.linalg.norm(embedding)
            )
            
            if similarity > best_similarity and similarity >= threshold:
                best_similarity = similarity
                best_category = (category, subcategory)
        
        return best_category
    
    async def get_openai_category_async(self, title: str) -> Tuple[str, str]:
        """Async version of OpenAI categorization"""
        try:
            messages = [
                {"role": "system", "content": "You are a product categorization expert. Categorize products into 'Category|Subcategory' format only."},
                {"role": "user", "content": f"""Categorize this product:
{title}

Examples:
Nike Air Max → Footwear|Running Shoes
Samsung TV → Electronics|Televisions
Cotton T-Shirt → Clothing|T-Shirts"""}
            ]
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.2,
                max_tokens=30
            )
            
            categories = response.choices[0].message.content.strip()
            
            # Parse response
            if '|' in categories:
                parts = categories.split('|')
                return parts[0].strip(), parts[1].strip()
            
            return categories, "Unspecified"
            
        except Exception as e:
            print(f"Error processing '{title}': {str(e)}")
            return "Unknown", "Unknown"
    
    async def process_batch_async(self, titles: List[str], batch_size: int = 20) -> List[Tuple[str, str]]:
        """Process titles in batches with async requests"""
        results = []
        
        for i in range(0, len(titles), batch_size):
            batch = titles[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self.get_openai_category_async(title) for title in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle results and exceptions
            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    print(f"Error processing {batch[j]}: {result}")
                    results.append(("Unknown", "Unknown"))
                else:
                    results.append(result)
                    # Cache successful results
                    self.cache_category(batch[j], result[0], result[1])
            
            # Small delay between batches to respect rate limits
            await asyncio.sleep(0.1)
        
        return results
    
    def get_category_with_optimizations(self, title: str) -> Tuple[str, str, str]:
        """
        Get category using all optimization strategies
        Returns: (category, subcategory, method_used)
        """
        
        # Strategy 1: Check exact cache
        cached = self.get_cached_category(title)
        if cached:
            return cached[0], cached[1], "exact_cache"
        
        # Strategy 2: Check similarity cache
        similar = self.find_similar_category(title)
        if similar:
            # Cache this result too
            self.cache_category(title, similar[0], similar[1], confidence=0.8)
            return similar[0], similar[1], "similarity_cache"
        
        # Strategy 3: Use rule-based pre-filtering
        rule_based = self.rule_based_categorization(title)
        if rule_based:
            self.cache_category(title, rule_based[0], rule_based[1], confidence=0.6)
            return rule_based[0], rule_based[1], "rule_based"
        
        # Strategy 4: Fall back to OpenAI (this should be minimized)
        category, subcategory = asyncio.run(self.get_openai_category_async(title))
        
        # Cache and store embedding for future similarity matching
        embedding = self.sentence_model.encode([title])[0]
        self.category_cache[title] = (category, subcategory, embedding)
        self.cache_category(title, category, subcategory, confidence=1.0)
        
        return category, subcategory, "openai_api"
    
    def rule_based_categorization(self, title: str) -> Optional[Tuple[str, str]]:
        """Simple rule-based categorization for common patterns"""
        title_lower = title.lower()
        
        # Electronics keywords
        electronics_keywords = {
            'phone': ('Electronics', 'Mobile Phones'),
            'tv': ('Electronics', 'Televisions'),
            'laptop': ('Electronics', 'Computers'),
            'headphones': ('Electronics', 'Audio'),
            'speaker': ('Electronics', 'Audio'),
            'camera': ('Electronics', 'Cameras'),
            'watch': ('Electronics', 'Wearables'),
            'tablet': ('Electronics', 'Computers')
        }
        
        # Clothing keywords
        clothing_keywords = {
            'shirt': ('Clothing', 'Shirts'),
            't-shirt': ('Clothing', 'T-Shirts'),
            'dress': ('Clothing', 'Dresses'),
            'jeans': ('Clothing', 'Jeans'),
            'shoes': ('Footwear', 'Shoes'),
            'boots': ('Footwear', 'Boots'),
            'sneakers': ('Footwear', 'Sneakers'),
            'jacket': ('Clothing', 'Outerwear'),
            'coat': ('Clothing', 'Outerwear')
        }
        
        # Beauty keywords
        beauty_keywords = {
            'perfume': ('Beauty', 'Fragrances'),
            'makeup': ('Beauty', 'Makeup'),
            'lipstick': ('Beauty', 'Makeup'),
            'foundation': ('Beauty', 'Makeup'),
            'shampoo': ('Beauty', 'Hair Care'),
            'moisturizer': ('Beauty', 'Skincare'),
            'serum': ('Beauty', 'Skincare')
        }
        
        # Check all keyword dictionaries
        for keywords_dict in [electronics_keywords, clothing_keywords, beauty_keywords]:
            for keyword, (category, subcategory) in keywords_dict.items():
                if keyword in title_lower:
                    return category, subcategory
        
        return None
    
    def process_dataframe_optimized(self, df: pd.DataFrame, title_column: str = 'Item Title') -> pd.DataFrame:
        """Process entire dataframe with all optimizations"""
        titles = df[title_column].tolist()
        
        print(f"Processing {len(titles)} products with optimizations...")
        
        categories = []
        subcategories = []
        methods = []
        
        # Track optimization effectiveness
        method_counts = defaultdict(int)
        
        start_time = time.time()
        
        for i, title in enumerate(titles):
            category, subcategory, method = self.get_category_with_optimizations(title)
            categories.append(category)
            subcategories.append(subcategory)
            methods.append(method)
            method_counts[method] += 1
            
            if (i + 1) % 100 == 0:
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed
                print(f"Processed {i + 1}/{len(titles)} products ({rate:.1f} products/sec)")
        
        # Add results to dataframe
        df['openai_category'] = categories
        df['openai_subcategory'] = subcategories
        df['categorization_method'] = methods
        
        # Save cache for future use
        self.save_category_cache()
        
        # Print optimization stats
        total_time = time.time() - start_time
        print(f"\nOptimization Results:")
        print(f"Total time: {total_time:.2f} seconds")
        print(f"Rate: {len(titles) / total_time:.1f} products/second")
        print(f"Method breakdown:")
        for method, count in method_counts.items():
            pct = (count / len(titles)) * 100
            print(f"  {method}: {count} ({pct:.1f}%)")
        
        return df

# OpenAI Batch API Integration (for even better scaling)
class BatchCategoryProcessor:
    def __init__(self, openai_api_key: str):
        self.client = openai.OpenAI(api_key=openai_api_key)
    
    def create_batch_file(self, titles: List[str], output_file: str):
        """Create JSONL file for batch processing"""
        batch_requests = []
        
        for i, title in enumerate(titles):
            request = {
                "custom_id": f"request-{i}",
                "method": "POST",
                "url": "/v1/chat/completions",
                "body": {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "Categorize products into 'Category|Subcategory' format only."},
                        {"role": "user", "content": f"Categorize: {title}"}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 30
                }
            }
            batch_requests.append(request)
        
        with open(output_file, 'w') as f:
            for request in batch_requests:
                f.write(json.dumps(request) + '\n')
        
        print(f"Created batch file with {len(batch_requests)} requests: {output_file}")
    
    def submit_batch(self, batch_file: str) -> str:
        """Submit batch file to OpenAI"""
        with open(batch_file, 'rb') as f:
            batch_input_file = self.client.files.create(
                file=f,
                purpose="batch"
            )
        
        batch_job = self.client.batches.create(
            input_file_id=batch_input_file.id,
            endpoint="/v1/chat/completions",
            completion_window="24h"
        )
        
        print(f"Batch job submitted: {batch_job.id}")
        return batch_job.id
    
    def get_batch_results(self, batch_id: str) -> Optional[List[Dict]]:
        """Get results from completed batch"""
        batch_job = self.client.batches.retrieve(batch_id)
        
        if batch_job.status == "completed":
            result_file_id = batch_job.output_file_id
            result = self.client.files.content(result_file_id)
            
            results = []
            for line in result.text.strip().split('\n'):
                results.append(json.loads(line))
            
            return results
        else:
            print(f"Batch status: {batch_job.status}")
            return None

# Usage example function
def optimize_category_generation(df: pd.DataFrame, openai_api_key: str) -> pd.DataFrame:
    """
    Main function to optimize category generation for a dataframe
    """
    
    # Initialize optimized processor
    processor = OptimizedCategoryGenerator(openai_api_key)
    
    # Process with all optimizations
    optimized_df = processor.process_dataframe_optimized(df)
    
    return optimized_df

# Local model alternative (for even faster processing)
class LocalCategoryModel:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.category_clusters = {}
        self.is_trained = False
    
    def train_from_existing_data(self, df: pd.DataFrame):
        """Train local model using existing categorized data"""
        if 'openai_category' not in df.columns:
            print("No existing category data found. Cannot train local model.")
            return
        
        # Get embeddings for all titles
        titles = df['Item Title'].tolist()
        categories = df['openai_category'].tolist()
        
        embeddings = self.model.encode(titles)
        
        # Create category clusters
        unique_categories = list(set(categories))
        
        for category in unique_categories:
            category_mask = df['openai_category'] == category
            category_embeddings = embeddings[category_mask]
            
            if len(category_embeddings) > 0:
                # Calculate centroid for this category
                centroid = np.mean(category_embeddings, axis=0)
                self.category_clusters[category] = centroid
        
        self.is_trained = True
        print(f"Trained local model with {len(unique_categories)} categories")
    
    def predict_category(self, title: str, threshold: float = 0.7) -> Optional[str]:
        """Predict category using local model"""
        if not self.is_trained:
            return None
        
        title_embedding = self.model.encode([title])[0]
        
        best_similarity = 0
        best_category = None
        
        for category, centroid in self.category_clusters.items():
            similarity = np.dot(title_embedding, centroid) / (
                np.linalg.norm(title_embedding) * np.linalg.norm(centroid)
            )
            
            if similarity > best_similarity and similarity >= threshold:
                best_similarity = similarity
                best_category = category
        
        return best_category 