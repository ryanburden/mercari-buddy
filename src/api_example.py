from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import asyncio
from datetime import datetime
import uuid

# Import your existing AI functions
from category_gen import generate_categories

app = FastAPI(title="Mercari Sales Intelligence API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic models
class User(BaseModel):
    id: str
    email: str
    subscription_tier: str
    created_at: datetime

class ProductAnalysis(BaseModel):
    id: str
    user_id: str
    filename: str
    total_products: int
    processing_status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

class CategoryInsight(BaseModel):
    category: str
    subcategory: str
    product_count: int
    total_revenue: float
    avg_price: float
    confidence_score: float

class AnalysisResponse(BaseModel):
    analysis_id: str
    insights: List[CategoryInsight]
    temporal_patterns: dict
    recommendations: List[str]

# Dependency for authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In production, verify JWT token here
    # For now, mock user
    return User(
        id="user_123",
        email="seller@example.com", 
        subscription_tier="pro",
        created_at=datetime.now()
    )

# Background task for AI processing
async def process_sales_data(analysis_id: str, file_path: str, user_id: str):
    """Background task to process uploaded sales data"""
    try:
        # Update status to processing
        print(f"Starting analysis {analysis_id} for user {user_id}")
        
        # Load and process data using your existing functions
        df = pd.read_csv(file_path)
        df_processed = await generate_categories(df)
        
        # Save results to database (mock for now)
        print(f"Analysis {analysis_id} completed successfully")
        
        # In production: 
        # - Save to database
        # - Send email notification
        # - Update user dashboard
        
    except Exception as e:
        print(f"Analysis {analysis_id} failed: {e}")
        # Update status to failed, notify user

# API Endpoints
@app.post("/api/upload", response_model=ProductAnalysis)
async def upload_sales_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Upload and process Mercari sales data"""
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Generate analysis ID
    analysis_id = str(uuid.uuid4())
    
    # Save uploaded file
    file_path = f"uploads/{user.id}/{analysis_id}.csv"
    # In production: save to cloud storage (S3, etc.)
    
    # Start background processing
    background_tasks.add_task(process_sales_data, analysis_id, file_path, user.id)
    
    return ProductAnalysis(
        id=analysis_id,
        user_id=user.id,
        filename=file.filename,
        total_products=0,  # Will be updated after processing
        processing_status="processing",
        created_at=datetime.now()
    )

@app.get("/api/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    user: User = Depends(get_current_user)
):
    """Get analysis results"""
    
    # In production: fetch from database
    # For now, return mock data
    return AnalysisResponse(
        analysis_id=analysis_id,
        insights=[
            CategoryInsight(
                category="Electronics",
                subcategory="Smartphones", 
                product_count=45,
                total_revenue=2500.00,
                avg_price=55.56,
                confidence_score=0.87
            ),
            CategoryInsight(
                category="Clothing",
                subcategory="T-Shirts",
                product_count=32,
                total_revenue=1200.00,
                avg_price=37.50,
                confidence_score=0.92
            )
        ],
        temporal_patterns={
            "best_day": "Sunday",
            "best_season": "Summer",
            "peak_months": ["June", "July", "August"]
        },
        recommendations=[
            "Focus on Electronics - highest revenue per item",
            "List new items on Sundays for better visibility",
            "Stock up on summer items in Q2"
        ]
    )

@app.get("/api/user/dashboard")
async def get_dashboard_data(user: User = Depends(get_current_user)):
    """Get user dashboard overview"""
    
    return {
        "user": user,
        "recent_analyses": [],
        "subscription_usage": {
            "products_processed": 1250,
            "monthly_limit": 2000,
            "tier": user.subscription_tier
        },
        "quick_stats": {
            "total_revenue": 15750.00,
            "avg_confidence": 0.84,
            "top_category": "Electronics"
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 