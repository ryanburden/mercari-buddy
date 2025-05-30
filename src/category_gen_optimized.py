from sentence_transformers import SentenceTransformer
import umap
import hdbscan
from data_parser import parse_data
import pandas as pd
import os
import time
from dotenv import load_dotenv
from ai_optimization import OptimizedCategoryGenerator, LocalCategoryModel

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key from environment variable
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

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

def calculate_confidence_scores(df):
    """
    Calculate confidence scores for OpenAI categories based on clustering consistency
    """
    confidence_scores = []
    
    for idx, row in df.iterrows():
        cluster_label = row['cluster_label']
        product_category = row['openai_category']
        product_subcategory = row['openai_subcategory']
        
        # Handle noise points (cluster -1)
        if cluster_label == -1:
            confidence_scores.append(0.3)  # Low confidence for noise points
            continue
        
        # Get all products in the same cluster
        cluster_products = df[df['cluster_label'] == cluster_label]
        cluster_size = len(cluster_products)
        
        # Calculate category consistency within cluster
        same_category_count = len(cluster_products[cluster_products['openai_category'] == product_category])
        same_subcategory_count = len(cluster_products[cluster_products['openai_subcategory'] == product_subcategory])
        
        # Calculate consistency ratios
        category_consistency = same_category_count / cluster_size
        subcategory_consistency = same_subcategory_count / cluster_size
        
        # Calculate base confidence score
        # Weight: 60% category consistency + 40% subcategory consistency
        base_confidence = (category_consistency * 0.6) + (subcategory_consistency * 0.4)
        
        # Apply cluster size adjustment
        # Larger clusters (more validation) get slight boost, smaller clusters get slight penalty
        if cluster_size >= 10:
            size_multiplier = 1.1
        elif cluster_size >= 5:
            size_multiplier = 1.0
        elif cluster_size >= 3:
            size_multiplier = 0.9
        else:
            size_multiplier = 0.8
        
        # Final confidence score (capped at 1.0)
        confidence = min(base_confidence * size_multiplier, 1.0)
        confidence_scores.append(round(confidence, 3))
    
    return confidence_scores

def generate_categories_optimized(df, use_local_model=False, existing_data_path=None):
    """
    Generate categories using optimized methods for scaling
    """
    # Add temporal features first
    df = add_temporal_features(df)
    
    # Normalize titles
    product_titles = normalize_titles(df, 'Item Title')
    print("Normalized titles: ", product_titles[0:10])
    
    # Initialize sentence transformer for clustering
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Generate embeddings
    embeddings = model.encode(product_titles, convert_to_tensor=True)
    print("Embeddings created")

    # Perform dimensionality reduction using UMAP
    reducer = umap.UMAP(n_components=10, random_state=42)
    reduced_embeddings = reducer.fit_transform(embeddings)
    print("Embeddings reduced")

    # Cluster embeddings using HDBSCAN
    clusterer = hdbscan.HDBSCAN(min_cluster_size=5)
    labels = clusterer.fit_predict(reduced_embeddings)
    print("Embeddings clustered")

    # Add cluster labels to the DataFrame
    df['cluster_label'] = labels
    print("Cluster labels added")

    # Generate categories using optimized method
    print("Generating categories with optimizations...")
    
    if use_local_model and existing_data_path and os.path.exists(existing_data_path):
        # Use local model trained on existing data
        print("Using local model for categorization...")
        local_model = LocalCategoryModel()
        
        # Train on existing data
        existing_df = pd.read_csv(existing_data_path)
        local_model.train_from_existing_data(existing_df)
        
        # Apply local model first, fall back to optimized OpenAI
        optimizer = OptimizedCategoryGenerator(openai_api_key)
        
        categories = []
        subcategories = []
        methods = []
        
        for title in product_titles:
            # Try local model first
            local_category = local_model.predict_category(title)
            
            if local_category:
                categories.append(local_category)
                subcategories.append("Local Prediction")
                methods.append("local_model")
            else:
                # Fall back to optimized OpenAI method
                category, subcategory, method = optimizer.get_category_with_optimizations(title)
                categories.append(category)
                subcategories.append(subcategory)
                methods.append(method)
        
        df['openai_category'] = categories
        df['openai_subcategory'] = subcategories
        df['categorization_method'] = methods
        
    else:
        # Use optimized OpenAI method
        optimizer = OptimizedCategoryGenerator(openai_api_key)
        df = optimizer.process_dataframe_optimized(df)
    
    print("Categories generated with optimizations!")

    # Calculate confidence scores based on clustering consistency
    print("Calculating confidence scores...")
    confidence_scores = calculate_confidence_scores(df)
    df['confidence_score'] = confidence_scores
    print("Confidence scores added")

    return df

def compare_optimization_methods(df, sample_size=50):
    """
    Compare different optimization methods to show speed improvements
    """
    print(f"\n{'='*60}")
    print("OPTIMIZATION COMPARISON")
    print(f"{'='*60}")
    
    # Take a sample for testing
    sample_df = df.head(sample_size).copy()
    titles = sample_df['Item Title'].tolist()
    
    print(f"Testing with {len(titles)} products...")
    
    # Method 1: Original synchronous method (simulated)
    print("\n1. Original Method (Simulated):")
    original_time = len(titles) * 0.5  # 0.5 seconds per product (your current method)
    print(f"   Estimated time: {original_time:.1f} seconds")
    print(f"   Rate: {len(titles) / original_time:.1f} products/second")
    
    # Method 2: Optimized method
    print("\n2. Optimized Method:")
    start_time = time.time()
    optimizer = OptimizedCategoryGenerator(openai_api_key)
    optimized_df = optimizer.process_dataframe_optimized(sample_df)
    optimized_time = time.time() - start_time
    
    print(f"   Actual time: {optimized_time:.1f} seconds")
    print(f"   Rate: {len(titles) / optimized_time:.1f} products/second")
    print(f"   Speed improvement: {original_time / optimized_time:.1f}x faster")
    
    # Show method breakdown
    method_counts = optimized_df['categorization_method'].value_counts()
    print(f"\n   Method breakdown:")
    for method, count in method_counts.items():
        pct = (count / len(titles)) * 100
        print(f"     {method}: {count} ({pct:.1f}%)")
    
    print(f"\n{'='*60}")
    print(f"PROJECTED SCALING IMPROVEMENTS")
    print(f"{'='*60}")
    
    # Projections for different scales
    scales = [100, 1000, 10000, 100000]
    
    for scale in scales:
        original_proj = scale * 0.5
        optimized_proj = scale * (optimized_time / len(titles))
        
        print(f"\nFor {scale:,} products:")
        print(f"  Original method: {original_proj/60:.1f} minutes ({original_proj/3600:.1f} hours)")
        print(f"  Optimized method: {optimized_proj/60:.1f} minutes ({optimized_proj/3600:.1f} hours)")
        print(f"  Time saved: {(original_proj - optimized_proj)/3600:.1f} hours")

if __name__ == "__main__":
    # Load data
    df = parse_data("data\Custom-sales-report_010117-053025_all.csv")[:-2]
    
    # Option 1: Run optimization comparison
    print("Running optimization comparison...")
    compare_optimization_methods(df, sample_size=20)
    
    # Option 2: Generate categories with optimizations
    print("\nGenerating categories for full dataset...")
    df = generate_categories_optimized(
        df, 
        use_local_model=False,  # Set to True if you have existing categorized data
        existing_data_path="data/openai_categories.csv"  # Path to existing data for training
    )
    
    # Print results
    print("\nCluster distribution:")
    print(df['cluster_label'].value_counts())
    print("\nCategory distribution:")
    print(df['openai_category'].value_counts())
    print("\nSubcategory distribution:")
    print(df['openai_subcategory'].value_counts())
    
    if 'categorization_method' in df.columns:
        print("\nOptimization method distribution:")
        print(df['categorization_method'].value_counts())
    
    print("\nDay of week distribution:")
    print(df['day_of_week'].value_counts())
    print("\nSeason distribution:")
    print(df['season'].value_counts())
    
    # Confidence score analysis
    print("\n" + "="*50)
    print("CONFIDENCE SCORE ANALYSIS")
    print("="*50)
    print(f"Average confidence score: {df['confidence_score'].mean():.3f}")
    print(f"Median confidence score: {df['confidence_score'].median():.3f}")
    print(f"Min confidence score: {df['confidence_score'].min():.3f}")
    print(f"Max confidence score: {df['confidence_score'].max():.3f}")
    
    # Show confidence distribution
    print("\nConfidence score distribution:")
    confidence_bins = [0, 0.3, 0.5, 0.7, 0.9, 1.0]
    confidence_labels = ['Very Low (0-0.3)', 'Low (0.3-0.5)', 'Medium (0.5-0.7)', 'High (0.7-0.9)', 'Very High (0.9-1.0)']
    df['confidence_bin'] = pd.cut(df['confidence_score'], bins=confidence_bins, labels=confidence_labels, include_lowest=True)
    print(df['confidence_bin'].value_counts())
    
    # Save results
    df.to_csv("data/openai_categories_optimized.csv", index=False)
    print(f"\nResults saved to: data/openai_categories_optimized.csv") 