"""
Clustering Analysis Module
-------------------------
This module contains clustering functionality that can be used for:
- Product similarity analysis
- Category validation research  
- Advanced analytics features
- Confidence scoring experiments

Separated from main pipeline for optional use.
"""

from sentence_transformers import SentenceTransformer
import umap
import hdbscan
import pandas as pd
import numpy as np
from typing import List, Tuple, Dict
import matplotlib.pyplot as plt
import seaborn as sns

class ProductClusterAnalyzer:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        """Initialize the clustering analyzer"""
        self.model = SentenceTransformer(model_name)
        self.reducer = None
        self.clusterer = None
        self.embeddings = None
        self.reduced_embeddings = None
        self.cluster_labels = None
        
    def generate_embeddings(self, product_titles: List[str]) -> np.ndarray:
        """Generate embeddings for product titles"""
        print(f"Generating embeddings for {len(product_titles)} products...")
        self.embeddings = self.model.encode(product_titles, convert_to_tensor=False)
        print("Embeddings generated successfully")
        return self.embeddings
    
    def reduce_dimensions(self, n_components=10, random_state=42) -> np.ndarray:
        """Reduce embedding dimensions using UMAP"""
        if self.embeddings is None:
            raise ValueError("Must generate embeddings first")
            
        print(f"Reducing dimensions to {n_components} components...")
        self.reducer = umap.UMAP(n_components=n_components, random_state=random_state)
        self.reduced_embeddings = self.reducer.fit_transform(self.embeddings)
        print("Dimension reduction completed")
        return self.reduced_embeddings
    
    def cluster_products(self, min_cluster_size=5) -> np.ndarray:
        """Cluster products using HDBSCAN"""
        if self.reduced_embeddings is None:
            raise ValueError("Must reduce dimensions first")
            
        print(f"Clustering with min_cluster_size={min_cluster_size}...")
        self.clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size)
        self.cluster_labels = self.clusterer.fit_predict(self.reduced_embeddings)
        
        n_clusters = len(set(self.cluster_labels)) - (1 if -1 in self.cluster_labels else 0)
        n_noise = list(self.cluster_labels).count(-1)
        
        print(f"Found {n_clusters} clusters with {n_noise} noise points")
        return self.cluster_labels
    
    def analyze_clusters(self, df: pd.DataFrame, title_column: str) -> Dict:
        """Analyze cluster composition and statistics"""
        if self.cluster_labels is None:
            raise ValueError("Must perform clustering first")
            
        df_copy = df.copy()
        df_copy['cluster_label'] = self.cluster_labels
        
        analysis = {
            'cluster_stats': {},
            'category_consistency': {},
            'cluster_examples': {}
        }
        
        # Basic cluster statistics
        unique_clusters = set(self.cluster_labels)
        for cluster_id in unique_clusters:
            if cluster_id == -1:  # Skip noise
                continue
                
            cluster_data = df_copy[df_copy['cluster_label'] == cluster_id]
            cluster_size = len(cluster_data)
            
            analysis['cluster_stats'][cluster_id] = {
                'size': cluster_size,
                'avg_price': cluster_data.get('Sale Price', pd.Series()).mean() if 'Sale Price' in cluster_data else 0,
                'products': cluster_data[title_column].head(5).tolist()
            }
            
            # Category consistency (if available)
            if 'openai_category' in cluster_data.columns:
                categories = cluster_data['openai_category'].value_counts()
                consistency = categories.iloc[0] / cluster_size if len(categories) > 0 else 0
                
                analysis['category_consistency'][cluster_id] = {
                    'dominant_category': categories.index[0] if len(categories) > 0 else 'Unknown',
                    'consistency_ratio': consistency,
                    'category_distribution': dict(categories)
                }
        
        return analysis
    
    def calculate_clustering_confidence(self, df: pd.DataFrame) -> List[float]:
        """
        Calculate confidence scores based on clustering consistency
        This is the original confidence scoring method
        """
        if self.cluster_labels is None:
            raise ValueError("Must perform clustering first")
            
        df_copy = df.copy()
        df_copy['cluster_label'] = self.cluster_labels
        confidence_scores = []
        
        for idx, row in df_copy.iterrows():
            cluster_label = row['cluster_label']
            
            # Handle noise points (cluster -1)
            if cluster_label == -1:
                confidence_scores.append(0.3)  # Low confidence for noise points
                continue
            
            # Get all products in the same cluster
            cluster_products = df_copy[df_copy['cluster_label'] == cluster_label]
            cluster_size = len(cluster_products)
            
            if 'openai_category' in row and 'openai_subcategory' in row:
                product_category = row['openai_category']
                product_subcategory = row['openai_subcategory']
                
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
            else:
                # No category data available
                confidence_scores.append(0.5)
        
        return confidence_scores
    
    def visualize_clusters(self, df: pd.DataFrame, title_column: str, save_path=None):
        """Create cluster visualizations"""
        if self.reduced_embeddings is None or self.cluster_labels is None:
            raise ValueError("Must perform clustering first")
            
        # Create 2D visualization (use first 2 UMAP components)
        if self.reduced_embeddings.shape[1] >= 2:
            plt.figure(figsize=(12, 8))
            
            # Color by cluster
            unique_labels = set(self.cluster_labels)
            colors = plt.cm.Set1(np.linspace(0, 1, len(unique_labels)))
            
            for cluster_id, color in zip(unique_labels, colors):
                if cluster_id == -1:
                    # Noise points in black
                    mask = self.cluster_labels == cluster_id
                    plt.scatter(self.reduced_embeddings[mask, 0], 
                              self.reduced_embeddings[mask, 1], 
                              c='black', marker='x', alpha=0.5, label='Noise')
                else:
                    mask = self.cluster_labels == cluster_id
                    plt.scatter(self.reduced_embeddings[mask, 0], 
                              self.reduced_embeddings[mask, 1], 
                              c=[color], label=f'Cluster {cluster_id}')
            
            plt.title('Product Clustering Visualization (UMAP 2D)')
            plt.xlabel('UMAP 1')
            plt.ylabel('UMAP 2')
            plt.legend()
            
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.show()
    
    def full_clustering_pipeline(self, df: pd.DataFrame, title_column: str, 
                                min_cluster_size=5, n_components=10) -> pd.DataFrame:
        """Run the complete clustering pipeline"""
        
        # Normalize titles
        product_titles = [str(title).strip().lower() for title in df[title_column]]
        
        # Generate embeddings
        self.generate_embeddings(product_titles)
        
        # Reduce dimensions
        self.reduce_dimensions(n_components=n_components)
        
        # Cluster products
        self.cluster_products(min_cluster_size=min_cluster_size)
        
        # Add results to dataframe
        df_result = df.copy()
        df_result['cluster_label'] = self.cluster_labels
        
        # Analyze clusters
        analysis = self.analyze_clusters(df_result, title_column)
        
        print("\nClustering Analysis Complete!")
        print(f"Found {len(set(self.cluster_labels)) - (1 if -1 in self.cluster_labels else 0)} clusters")
        print(f"Noise points: {list(self.cluster_labels).count(-1)}")
        
        return df_result, analysis

# Example usage functions
def run_clustering_analysis(df: pd.DataFrame, title_column='Item Title'):
    """Run clustering analysis on a dataset"""
    analyzer = ProductClusterAnalyzer()
    df_clustered, analysis = analyzer.full_clustering_pipeline(df, title_column)
    
    # Print some insights
    print("\nTop 3 Largest Clusters:")
    cluster_sizes = [(cid, stats['size']) for cid, stats in analysis['cluster_stats'].items()]
    cluster_sizes.sort(key=lambda x: x[1], reverse=True)
    
    for cluster_id, size in cluster_sizes[:3]:
        print(f"\nCluster {cluster_id} ({size} products):")
        examples = analysis['cluster_stats'][cluster_id]['products']
        for i, product in enumerate(examples, 1):
            print(f"  {i}. {product}")
    
    return df_clustered, analysis

if __name__ == "__main__":
    # Example usage
    print("Clustering Analysis Module")
    print("This module can be imported and used for advanced product analysis")
    print("Example: from clustering_analysis import run_clustering_analysis") 