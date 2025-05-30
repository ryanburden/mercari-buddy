# 📊 E-commerce Sales Intelligence Dashboard

This directory contains the Streamlit-based interactive dashboard for analyzing e-commerce sales data with AI-powered category intelligence.

## 🚀 Quick Start

### Prerequisites
Make sure you have the required dependencies installed:
```bash
pip install -r ../requirements.txt
```

### Running the Dashboard
From the project root directory:
```bash
streamlit run dashboard/streamlit_dashboard.py
```

Or from within the dashboard directory:
```bash
cd dashboard
streamlit run streamlit_dashboard.py
```

The dashboard will open in your default web browser at `http://localhost:8501`

## 📈 Dashboard Features

### 🔍 Interactive Filters
- **Date Range**: Filter sales data by specific time periods
- **Categories**: Select specific product categories to analyze
- **Confidence Score**: Filter by AI categorization confidence levels

### 📊 Analytics Tabs

#### 1. Revenue Analytics
- Total revenue, profit, and margin metrics
- Revenue and profit breakdown by category
- Monthly revenue trends over time

#### 2. Category Intelligence
- Performance matrix with key metrics per category
- Price distribution analysis
- Top performing subcategories
- AI categorization vs clustering alignment

#### 3. Geographic Insights
- Sales performance by state
- Average order value by location
- Regional category preferences

#### 4. Performance Metrics
- Best performing products and categories
- Growth opportunities identification
- Shipping cost analysis
- True profit margins after all fees

#### 5. Data Quality
- Confidence score distributions
- Clustering analysis results
- Items flagged for manual review

#### 6. Strategic Recommendations
- AI-generated business insights
- Focus areas for growth
- Areas needing improvement
- Automated strategic recommendations

## 🎯 Business Value

This dashboard helps e-commerce sellers make data-driven decisions by providing:

- **Inventory Strategy**: Identify which categories to expand or focus on
- **Pricing Optimization**: Discover high-margin opportunities
- **Geographic Targeting**: Understand where to focus marketing efforts
- **Quality Control**: Find products with unclear categorizations
- **Revenue Growth**: Get specific recommendations for increasing sales

## 📁 File Structure

```
dashboard/
├── streamlit_dashboard.py  # Main dashboard application
└── README.md              # This file

../src/                     # Backend processing code
├── category_gen.py         # AI categorization and clustering
├── data_parser.py         # Data loading utilities

../data/                    # Data files
└── openai_categories.csv  # Processed sales data with AI categories

../requirements.txt        # Python dependencies
└── .env                   # Environment variables (API keys)
```

## 🔧 Customization

The dashboard is modular and can be easily customized:

- **Add new metrics**: Modify the metric calculation functions
- **New visualizations**: Add charts using Plotly or other libraries
- **Custom filters**: Extend the sidebar filtering options
- **Additional tabs**: Create new analysis sections

## 📝 Notes

- The dashboard reads data from `../data/openai_categories.csv`
- Confidence scores help validate AI categorizations
- All charts are interactive and exportable
- The app uses caching for better performance

## 🔒 Security

- No sensitive data is stored in the dashboard code
- API keys should be kept in the `.env` file (not committed to git)
- The dashboard runs locally by default 