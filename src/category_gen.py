from sentence_transformers import SentenceTransformer
import umap
import hdbscan
from keybert import KeyBERT
from data_parser import parse_data
import openai
from openai import OpenAI
import time
import pandas as pd
import os
from dotenv import load_dotenv

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

def get_openai_categories(title):
    client = OpenAI(api_key=openai_api_key)
    try:
        messages = [
            {"role": "system", "content": "You are a product categorization expert. Your task is to categorize product titles into a main category and subcategory. DO NOT provide URLs or links. Only provide the category and subcategory in the format 'Category|Subcategory'."},
            {"role": "user", "content": f"""Here are some examples:
Product: "Nike Air Max Running Shoes"
Response: "Footwear|Running Shoes"

Product: "Samsung 4K Smart TV 55 inch"
Response: "Electronics|Televisions"

Product: "Organic Cotton T-Shirt"
Response: "Clothing|T-Shirts"

Now categorize this product:
{title}"""}
        ]
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.3,
            max_tokens=50
        )
        
        categories = response.choices[0].message.content.strip()
        print(f"Raw API response for '{title}': {categories}")  # Debug print
        
        # Handle various response formats
        if '|' in categories:
            parts = categories.split('|')
            if len(parts) == 2:
                return parts[0].strip(), parts[1].strip()
            else:
                # If we have more than 2 parts, take the first two
                return parts[0].strip(), parts[1].strip()
        elif ':' in categories:
            # Try to handle "Category: Subcategory" format
            parts = categories.split(':')
            if len(parts) == 2:
                return parts[0].strip(), parts[1].strip()
        
        # If no clear separator found, return the whole response as category
        return categories, "Unspecified"
        
    except Exception as e:
        print(f"Error processing title '{title}': {str(e)}")
        return "Unknown", "Unknown"

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

def generate_categories(df):
    # Normalize titles
    product_titles = normalize_titles(df, 'Item Title')
    print("Normalized titles: ", product_titles[0:10])
    
    # Initialize sentence transformer
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

    # Generate OpenAI categories
    print("Generating OpenAI categories...")
    categories = []
    subcategories = []
    
    for title in product_titles:
        category, subcategory = get_openai_categories(title)
        categories.append(category)
        subcategories.append(subcategory)
        # Add a small delay to avoid rate limiting
        time.sleep(0.5)
    
    df['openai_category'] = categories
    df['openai_subcategory'] = subcategories
    print("OpenAI categories added")

    # Calculate confidence scores based on clustering consistency
    print("Calculating confidence scores...")
    confidence_scores = calculate_confidence_scores(df)
    df['confidence_score'] = confidence_scores
    print("Confidence scores added")

    return df

#def gen_subcategories(df):

if __name__ == "__main__":
    df = parse_data("data\Custom-sales-report_010117-053025_all.csv")[:100]
    df = generate_categories(df)
    print("\nCluster distribution:")
    print(df['cluster_label'].value_counts())
    print("\nCategory distribution:")
    print(df['openai_category'].value_counts())
    print("\nSubcategory distribution:")
    print(df['openai_subcategory'].value_counts())
    
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
    
    # Show examples of high and low confidence categorizations
    print("\nHIGH CONFIDENCE EXAMPLES (>0.8):")
    high_confidence = df[df['confidence_score'] > 0.8].head(5)
    for _, row in high_confidence.iterrows():
        print(f"  '{row['Item Title'][:50]}...' -> {row['openai_category']}|{row['openai_subcategory']} (Score: {row['confidence_score']})")
    
    print("\nLOW CONFIDENCE EXAMPLES (<0.5):")
    low_confidence = df[df['confidence_score'] < 0.5].head(5)
    for _, row in low_confidence.iterrows():
        print(f"  '{row['Item Title'][:50]}...' -> {row['openai_category']}|{row['openai_subcategory']} (Score: {row['confidence_score']})")
        
    # Show cluster consistency examples
    print("\nCLUSTER CONSISTENCY EXAMPLES:")
    for cluster_id in df['cluster_label'].unique()[:3]:
        if cluster_id != -1:  # Skip noise points
            cluster_data = df[df['cluster_label'] == cluster_id]
            if len(cluster_data) > 1:
                print(f"\nCluster {cluster_id} ({len(cluster_data)} products):")
                categories = cluster_data['openai_category'].value_counts()
                subcategories = cluster_data['openai_subcategory'].value_counts()
                print(f"  Categories: {dict(categories)}")
                print(f"  Subcategories: {dict(subcategories)}")
                avg_confidence = cluster_data['confidence_score'].mean()
                print(f"  Average confidence: {avg_confidence:.3f}")

    df.to_csv("data\openai_categories.csv", index=False)

