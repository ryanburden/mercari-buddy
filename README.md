# 🛍️ E-commerce Sales Intelligence Platform

An AI-powered platform for analyzing e-commerce sales data with automated product categorization, clustering analysis, and interactive business intelligence dashboards.

## 🚀 Features

- **AI Product Categorization**: Uses OpenAI GPT-3.5-turbo to automatically categorize products
- **Semantic Clustering**: Groups similar products using sentence embeddings and HDBSCAN
- **Confidence Scoring**: Validates AI categorizations using clustering consistency
- **Interactive Dashboard**: Streamlit-based business intelligence interface
- **Geographic Analytics**: Regional sales performance analysis
- **Revenue Optimization**: Profit margin and pricing insights

## 📁 Project Structure

```
ecom-sales-intelligence/
├── src/                        # Backend processing and analysis
│   ├── category_gen.py         # AI categorization and clustering engine
│   └── data_parser.py          # Data loading and preprocessing
├── dashboard/                  # Frontend Streamlit application
│   ├── streamlit_dashboard.py  # Interactive dashboard
│   └── README.md              # Dashboard documentation
├── docs/                       # Project documentation
│   ├── scaling-plan.md         # SaaS scaling strategy
│   └── mvp-implementation.md   # Technical implementation plan
├── data/                       # Data files
│   ├── Custom-sales-report_*.csv  # Raw sales data
│   └── openai_categories.csv      # Processed data with AI categories
├── requirements.txt            # Python dependencies
├── .env                       # Environment variables (API keys)
├── .gitignore                 # Git ignore patterns
└── README.md                  # This file
```

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ecom-sales-intelligence
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Install spaCy language model**
```bash
python -m spacy download en_core_web_sm
```

## 🎯 Usage

### Step 1: Process Sales Data
Run the AI categorization and clustering analysis:
```bash
python src/category_gen.py
```

This will:
- Load your sales data
- Generate AI-powered product categories
- Perform semantic clustering
- Calculate confidence scores
- Export results to `data/openai_categories.csv`

### Step 2: Launch Dashboard
Start the interactive business intelligence dashboard:
```bash
streamlit run dashboard/streamlit_dashboard.py
```

The dashboard will open at `http://localhost:8501` with:
- Revenue analytics and trends
- Category performance insights
- Geographic sales analysis
- Data quality metrics
- Strategic recommendations

## 📊 Dashboard Features

### Interactive Analytics
- **Revenue Analytics**: Track sales performance by category and time
- **Category Intelligence**: Understand product performance and pricing
- **Geographic Insights**: Analyze sales by state and region
- **Performance Metrics**: Identify top performers and opportunities
- **Data Quality**: Monitor AI categorization confidence
- **Recommendations**: Get AI-generated business insights

### Smart Filtering
- Filter by date ranges, categories, and confidence scores
- Real-time chart updates based on selections
- Export capabilities for all visualizations

## 🤖 AI Technology Stack

- **OpenAI GPT-3.5-turbo**: Product categorization
- **Sentence Transformers**: Semantic embeddings (all-MiniLM-L6-v2)
- **UMAP**: Dimensionality reduction
- **HDBSCAN**: Density-based clustering
- **Custom Confidence Scoring**: Validates AI predictions using cluster consistency

## 🚀 SaaS Scaling Plans

This project is designed to scale into a full SaaS platform for Mercari sellers. See our detailed plans:

- **[📈 Scaling Strategy](docs/scaling-plan.md)**: Complete business plan for turning this into a SaaS
- **[🛠️ MVP Implementation](docs/mvp-implementation.md)**: Technical roadmap for multi-user platform

### Business Opportunity
- **Target Market**: 2-5M active Mercari sellers
- **Revenue Model**: Freemium SaaS ($29-99/month)
- **Competitive Advantage**: First AI-powered categorization tool for Mercari
- **Market Validation**: Built with real seller data and proven results

### Technical Roadmap
- **Phase 1**: Multi-user web app with authentication and billing
- **Phase 2**: Advanced analytics and batch processing
- **Phase 3**: Mobile app and marketplace integrations

## 📈 Business Intelligence

The platform provides actionable insights for:

### Revenue Optimization
- Identify high-margin product categories
- Discover pricing opportunities
- Track seasonal trends

### Inventory Strategy
- Find underperforming categories with potential
- Optimize product mix based on profitability
- Geographic demand analysis

### Quality Control
- Flag products with unclear categorizations
- Improve product descriptions for better analysis
- Monitor data quality metrics

### Growth Opportunities
- Identify expansion categories
- Geographic market opportunities
- Cross-selling potential

## 🔒 Security & Privacy

- API keys stored securely in `.env` files
- No data transmitted outside your local environment
- Git ignores sensitive files automatically
- All processing runs locally

## 🛠️ Customization

### Adding New Categories
Modify the prompt in `src/category_gen.py` to include your specific category requirements.

### Custom Metrics
Extend the dashboard by adding new calculations and visualizations in `dashboard/streamlit_dashboard.py`.

### Data Sources
Update `src/data_parser.py` to handle different CSV formats or data sources.

## 📝 Requirements

- Python 3.8+
- OpenAI API key
- Sales data in CSV format with columns:
  - Item Title
  - Item Price
  - Sold Date
  - Shipped to State
  - (Other financial columns)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the dashboard README in `dashboard/README.md`
2. Review the scaling documentation in `docs/`
3. Review the code documentation
4. Open an issue on GitHub

---

**Built with ❤️ for data-driven e-commerce success**
