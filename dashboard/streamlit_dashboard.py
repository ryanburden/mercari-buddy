import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime
import seaborn as sns
import matplotlib.pyplot as plt

# Page configuration
st.set_page_config(
    page_title="E-commerce Sales Intelligence Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load data
@st.cache_data
def load_data():
    df = pd.read_csv("../data/openai_categories.csv")
    df['Sold Date'] = pd.to_datetime(df['Sold Date'])
    df['Profit'] = df['Net Seller Proceeds']
    df['Profit Margin'] = (df['Profit'] / df['Item Price']) * 100
    return df

# Main dashboard
def main():
    st.title("🛍️ E-commerce Sales Intelligence Dashboard")
    st.markdown("*Powered by AI Category Intelligence and Clustering Analysis*")
    
    # Load data
    df = load_data()
    
    # Sidebar filters
    st.sidebar.header("🔍 Filters")
    
    # Date range filter
    date_range = st.sidebar.date_input(
        "Select Date Range",
        value=[df['Sold Date'].min(), df['Sold Date'].max()],
        min_value=df['Sold Date'].min(),
        max_value=df['Sold Date'].max()
    )
    
    # Category filter
    categories = st.sidebar.multiselect(
        "Select Categories",
        options=df['openai_category'].unique(),
        default=df['openai_category'].unique()
    )
    
    # Confidence filter
    min_confidence = st.sidebar.slider(
        "Minimum Confidence Score",
        min_value=0.0,
        max_value=1.0,
        value=0.0,
        step=0.1
    )
    
    # Apply filters
    filtered_df = df[
        (df['Sold Date'] >= pd.to_datetime(date_range[0])) &
        (df['Sold Date'] <= pd.to_datetime(date_range[1])) &
        (df['openai_category'].isin(categories)) &
        (df['confidence_score'] >= min_confidence)
    ]
    
    # Main content tabs
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "📈 Revenue Analytics", 
        "🎯 Category Intelligence", 
        "🗺️ Geographic Insights", 
        "⚡ Performance Metrics",
        "🔬 Data Quality", 
        "💡 Recommendations"
    ])
    
    with tab1:
        revenue_analytics(filtered_df)
    
    with tab2:
        category_intelligence(filtered_df)
    
    with tab3:
        geographic_insights(filtered_df)
    
    with tab4:
        performance_metrics(filtered_df)
    
    with tab5:
        data_quality(filtered_df)
    
    with tab6:
        recommendations(filtered_df)

def revenue_analytics(df):
    st.header("💰 Revenue Analytics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_revenue = df['Item Price'].sum()
        st.metric("Total Revenue", f"${total_revenue:,.2f}")
    
    with col2:
        total_profit = df['Profit'].sum()
        st.metric("Total Profit", f"${total_profit:,.2f}")
    
    with col3:
        avg_margin = df['Profit Margin'].mean()
        st.metric("Avg Profit Margin", f"{avg_margin:.1f}%")
    
    with col4:
        total_items = len(df)
        st.metric("Items Sold", f"{total_items:,}")
    
    # Revenue by category
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Revenue by Category")
        category_revenue = df.groupby('openai_category')['Item Price'].sum().sort_values(ascending=False)
        fig = px.bar(
            x=category_revenue.values,
            y=category_revenue.index,
            orientation='h',
            title="Total Revenue by Category",
            labels={'x': 'Revenue ($)', 'y': 'Category'}
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("Profit by Category")
        category_profit = df.groupby('openai_category')['Profit'].sum().sort_values(ascending=False)
        fig = px.bar(
            x=category_profit.values,
            y=category_profit.index,
            orientation='h',
            title="Total Profit by Category",
            labels={'x': 'Profit ($)', 'y': 'Category'},
            color=category_profit.values,
            color_continuous_scale='Viridis'
        )
        st.plotly_chart(fig, use_container_width=True)
    
    # Time series analysis
    st.subheader("Revenue Trends Over Time")
    df['Month'] = df['Sold Date'].dt.to_period('M').astype(str)
    monthly_revenue = df.groupby(['Month', 'openai_category'])['Item Price'].sum().reset_index()
    
    fig = px.line(
        monthly_revenue,
        x='Month',
        y='Item Price',
        color='openai_category',
        title="Monthly Revenue by Category",
        labels={'Item Price': 'Revenue ($)', 'Month': 'Month'}
    )
    fig.update_layout(xaxis_tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)

def category_intelligence(df):
    st.header("🎯 Category Intelligence")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Category Performance Matrix")
        
        # Create performance matrix
        category_stats = df.groupby('openai_category').agg({
            'Item Price': ['mean', 'count'],
            'Profit Margin': 'mean',
            'confidence_score': 'mean'
        }).round(2)
        
        category_stats.columns = ['Avg Price', 'Sales Volume', 'Avg Margin %', 'Avg Confidence']
        category_stats = category_stats.sort_values('Avg Price', ascending=False)
        
        st.dataframe(category_stats, use_container_width=True)
    
    with col2:
        st.subheader("Price Distribution by Category")
        
        # Box plot of prices by category
        fig = px.box(
            df,
            x='openai_category',
            y='Item Price',
            title="Price Distribution by Category"
        )
        fig.update_layout(xaxis_tickangle=-45)
        st.plotly_chart(fig, use_container_width=True)
    
    # Subcategory analysis
    st.subheader("Top Performing Subcategories")
    
    subcategory_perf = df.groupby(['openai_category', 'openai_subcategory']).agg({
        'Item Price': 'sum',
        'Profit': 'sum',
        'Profit Margin': 'mean'
    }).round(2)
    
    subcategory_perf.columns = ['Total Revenue', 'Total Profit', 'Avg Margin %']
    subcategory_perf = subcategory_perf.sort_values('Total Revenue', ascending=False).head(15)
    
    st.dataframe(subcategory_perf, use_container_width=True)
    
    # Category vs Cluster analysis
    st.subheader("AI Categories vs Clustering Analysis")
    
    cluster_category = pd.crosstab(df['cluster_label'], df['openai_category'])
    fig = px.imshow(
        cluster_category.values,
        x=cluster_category.columns,
        y=[f"Cluster {i}" if i != -1 else "Noise" for i in cluster_category.index],
        title="Heatmap: Cluster vs AI Category Alignment",
        color_continuous_scale='Blues'
    )
    st.plotly_chart(fig, use_container_width=True)

def geographic_insights(df):
    st.header("🗺️ Geographic Insights")
    
    # State performance
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Sales by State")
        state_sales = df.groupby('Shipped to State').agg({
            'Item Price': 'sum',
            'Item Id': 'count'
        }).sort_values('Item Price', ascending=False).head(15)
        
        state_sales.columns = ['Total Revenue', 'Order Count']
        
        fig = px.bar(
            x=state_sales.index,
            y=state_sales['Total Revenue'],
            title="Top 15 States by Revenue",
            labels={'x': 'State', 'y': 'Revenue ($)'}
        )
        fig.update_layout(xaxis_tickangle=-45)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("Average Order Value by State")
        state_aov = df.groupby('Shipped to State')['Item Price'].mean().sort_values(ascending=False).head(15)
        
        fig = px.bar(
            x=state_aov.index,
            y=state_aov.values,
            title="Top 15 States by Average Order Value",
            labels={'x': 'State', 'y': 'AOV ($)'},
            color=state_aov.values,
            color_continuous_scale='Plasma'
        )
        fig.update_layout(xaxis_tickangle=-45)
        st.plotly_chart(fig, use_container_width=True)
    
    # Category preferences by region
    st.subheader("Category Preferences by Region")
    
    # Group states into regions (simplified)
    region_mapping = {
        'California': 'West', 'Washington': 'West', 'Oregon': 'West',
        'Texas': 'South', 'Florida': 'South', 'Georgia': 'South',
        'New York': 'Northeast', 'Pennsylvania': 'Northeast', 'Massachusetts': 'Northeast',
        'Illinois': 'Midwest', 'Ohio': 'Midwest', 'Michigan': 'Midwest'
    }
    
    df['Region'] = df['Shipped to State'].map(region_mapping).fillna('Other')
    
    region_category = df.groupby(['Region', 'openai_category'])['Item Price'].sum().reset_index()
    
    fig = px.sunburst(
        region_category,
        path=['Region', 'openai_category'],
        values='Item Price',
        title="Revenue Distribution: Region → Category"
    )
    st.plotly_chart(fig, use_container_width=True)

def performance_metrics(df):
    st.header("⚡ Performance Metrics")
    
    # Key performance indicators
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.subheader("🏆 Best Performers")
        
        # Highest revenue items
        top_items = df.nlargest(5, 'Item Price')[['Item Title', 'Item Price', 'openai_category', 'Profit Margin']]
        st.write("**Highest Revenue Items:**")
        for _, item in top_items.iterrows():
            st.write(f"• {item['Item Title'][:40]}... - ${item['Item Price']:.2f}")
    
    with col2:
        st.subheader("📊 Category Rankings")
        
        # Category rankings by different metrics
        ranking_metric = st.selectbox(
            "Rank categories by:",
            ["Total Revenue", "Average Price", "Profit Margin", "Sales Volume"]
        )
        
        if ranking_metric == "Total Revenue":
            ranking = df.groupby('openai_category')['Item Price'].sum().sort_values(ascending=False)
        elif ranking_metric == "Average Price":
            ranking = df.groupby('openai_category')['Item Price'].mean().sort_values(ascending=False)
        elif ranking_metric == "Profit Margin":
            ranking = df.groupby('openai_category')['Profit Margin'].mean().sort_values(ascending=False)
        else:  # Sales Volume
            ranking = df.groupby('openai_category').size().sort_values(ascending=False)
        
        for i, (category, value) in enumerate(ranking.head(10).items(), 1):
            if ranking_metric in ["Total Revenue", "Average Price"]:
                st.write(f"{i}. {category}: ${value:.2f}")
            elif ranking_metric == "Profit Margin":
                st.write(f"{i}. {category}: {value:.1f}%")
            else:
                st.write(f"{i}. {category}: {value} items")
    
    with col3:
        st.subheader("🎯 Opportunities")
        
        # Identify opportunities
        category_metrics = df.groupby('openai_category').agg({
            'Item Price': ['mean', 'count'],
            'Profit Margin': 'mean'
        })
        
        category_metrics.columns = ['avg_price', 'volume', 'margin']
        
        # High margin, low volume categories
        opportunities = category_metrics[
            (category_metrics['margin'] > category_metrics['margin'].median()) &
            (category_metrics['volume'] < category_metrics['volume'].median())
        ].sort_values('margin', ascending=False)
        
        st.write("**High Margin, Low Volume Categories:**")
        for category in opportunities.head(5).index:
            margin = opportunities.loc[category, 'margin']
            volume = opportunities.loc[category, 'volume']
            st.write(f"• {category}: {margin:.1f}% margin, {volume} sales")
    
    # Shipping cost analysis
    st.subheader("📦 Shipping Cost Analysis")
    
    col1, col2 = st.columns(2)
    
    with col1:
        shipping_by_category = df.groupby('openai_category').agg({
            'Buyer Shipping Fee': 'mean',
            'Seller Shipping Fee': 'mean'
        }).round(2)
        
        fig = go.Figure()
        fig.add_trace(go.Bar(name='Buyer Pays', x=shipping_by_category.index, y=shipping_by_category['Buyer Shipping Fee']))
        fig.add_trace(go.Bar(name='Seller Pays', x=shipping_by_category.index, y=shipping_by_category['Seller Shipping Fee']))
        
        fig.update_layout(
            title="Average Shipping Costs by Category",
            barmode='stack',
            xaxis_tickangle=-45
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Profit after all fees
        df['True Profit'] = df['Item Price'] - df['Mercari Selling Fee'] - df['Payment Processing Fee Charged To Seller'] - df['Seller Shipping Fee']
        df['True Margin'] = (df['True Profit'] / df['Item Price']) * 100
        
        true_margins = df.groupby('openai_category')['True Margin'].mean().sort_values(ascending=False)
        
        fig = px.bar(
            x=true_margins.index,
            y=true_margins.values,
            title="True Profit Margin by Category (After All Fees)",
            labels={'x': 'Category', 'y': 'True Margin (%)'},
            color=true_margins.values,
            color_continuous_scale='RdYlGn'
        )
        fig.update_layout(xaxis_tickangle=-45)
        st.plotly_chart(fig, use_container_width=True)

def data_quality(df):
    st.header("🔬 Data Quality & Confidence Analysis")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Confidence Score Distribution")
        
        fig = px.histogram(
            df,
            x='confidence_score',
            title="Distribution of Confidence Scores",
            nbins=20,
            labels={'confidence_score': 'Confidence Score', 'count': 'Frequency'}
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Confidence by category
        conf_by_category = df.groupby('openai_category')['confidence_score'].mean().sort_values(ascending=False)
        
        fig = px.bar(
            x=conf_by_category.index,
            y=conf_by_category.values,
            title="Average Confidence Score by Category",
            labels={'x': 'Category', 'y': 'Avg Confidence Score'},
            color=conf_by_category.values,
            color_continuous_scale='Viridis'
        )
        fig.update_layout(xaxis_tickangle=-45)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("Clustering vs AI Categories")
        
        # Cluster distribution
        cluster_dist = df['cluster_label'].value_counts().sort_index()
        
        fig = px.pie(
            values=cluster_dist.values,
            names=[f"Cluster {i}" if i != -1 else "Noise" for i in cluster_dist.index],
            title="Distribution of Clustering Results"
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Low confidence items for review
        st.subheader("Items Needing Review (Low Confidence)")
        low_conf = df[df['confidence_score'] < 0.3][['Item Title', 'openai_category', 'openai_subcategory', 'confidence_score', 'cluster_label']]
        low_conf = low_conf.sort_values('confidence_score')
        
        if len(low_conf) > 0:
            st.dataframe(low_conf.head(10), use_container_width=True)
        else:
            st.success("No items with low confidence scores!")

def recommendations(df):
    st.header("💡 Strategic Recommendations")
    
    # Calculate key insights
    total_revenue = df['Item Price'].sum()
    category_revenue = df.groupby('openai_category')['Item Price'].sum().sort_values(ascending=False)
    category_margins = df.groupby('openai_category')['Profit Margin'].mean().sort_values(ascending=False)
    category_volume = df.groupby('openai_category').size().sort_values(ascending=False)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🎯 Focus Areas")
        
        st.markdown("### Top Revenue Categories")
        for i, (category, revenue) in enumerate(category_revenue.head(3).items(), 1):
            pct = (revenue / total_revenue) * 100
            st.write(f"{i}. **{category}**: ${revenue:,.2f} ({pct:.1f}% of total revenue)")
        
        st.markdown("### High-Margin Opportunities")
        high_margin_cats = category_margins.head(3)
        for category, margin in high_margin_cats.items():
            volume = category_volume.get(category, 0)
            st.write(f"• **{category}**: {margin:.1f}% margin ({volume} items sold)")
        
        st.markdown("### Geographic Expansion")
        top_states = df.groupby('Shipped to State')['Item Price'].sum().sort_values(ascending=False).head(3)
        st.write("**Top performing states to prioritize:**")
        for state, revenue in top_states.items():
            st.write(f"• {state}: ${revenue:,.2f}")
    
    with col2:
        st.subheader("⚠️ Areas for Improvement")
        
        st.markdown("### Low Confidence Categories")
        low_conf_categories = df.groupby('openai_category')['confidence_score'].mean().sort_values().head(3)
        st.write("**Categories that may need better product descriptions:**")
        for category, conf in low_conf_categories.items():
            st.write(f"• {category}: {conf:.2f} confidence score")
        
        st.markdown("### Underperforming Categories")
        # Categories with low volume but decent margins
        cat_metrics = df.groupby('openai_category').agg({
            'Item Price': 'count',
            'Profit Margin': 'mean'
        })
        underperforming = cat_metrics[
            (cat_metrics['Item Price'] < cat_metrics['Item Price'].median()) &
            (cat_metrics['Profit Margin'] > cat_metrics['Profit Margin'].median())
        ].sort_values('Profit Margin', ascending=False)
        
        st.write("**Categories with potential for increased inventory:**")
        for category in underperforming.head(3).index:
            volume = underperforming.loc[category, 'Item Price']
            margin = underperforming.loc[category, 'Profit Margin']
            st.write(f"• {category}: Only {volume} items, {margin:.1f}% margin")
    
    # Strategic insights
    st.subheader("📈 Strategic Insights")
    
    insights = []
    
    # Insight 1: Top category dominance
    top_cat_pct = (category_revenue.iloc[0] / total_revenue) * 100
    if top_cat_pct > 30:
        insights.append(f"🔸 **Diversification Opportunity**: {category_revenue.index[0]} represents {top_cat_pct:.1f}% of revenue. Consider expanding other categories to reduce risk.")
    
    # Insight 2: Shipping costs
    avg_seller_shipping = df['Seller Shipping Fee'].mean()
    if avg_seller_shipping > 3:
        insights.append(f"🔸 **Shipping Optimization**: Average seller shipping cost is ${avg_seller_shipping:.2f}. Consider negotiating better rates or adjusting pricing strategy.")
    
    # Insight 3: High-value items
    high_value_threshold = df['Item Price'].quantile(0.9)
    high_value_margin = df[df['Item Price'] >= high_value_threshold]['Profit Margin'].mean()
    insights.append(f"🔸 **Premium Strategy**: High-value items (>${high_value_threshold:.0f}+) have {high_value_margin:.1f}% average margin. Focus on premium product sourcing.")
    
    # Insight 4: Low confidence data quality
    low_conf_pct = (df['confidence_score'] < 0.5).mean() * 100
    if low_conf_pct > 20:
        insights.append(f"🔸 **Data Quality**: {low_conf_pct:.1f}% of items have low categorization confidence. Improve product titles and descriptions for better analytics.")
    
    for insight in insights:
        st.markdown(insight)

if __name__ == "__main__":
    main() 