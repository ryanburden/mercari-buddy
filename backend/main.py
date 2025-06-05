from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import asyncio
import json
import uuid
import time
import os
import sys
from typing import Dict, Optional
from pydantic import BaseModel
import tempfile
from io import StringIO

# Add the project root to Python path to import our categorization module
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from src.analyze.category_gen import generate_categories

app = FastAPI(title="Ecommerce Intelligence API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for analysis jobs (in production, use Redis or a database)
analysis_jobs: Dict[str, dict] = {}

class AnalysisRequest(BaseModel):
    apiTier: Optional[str] = "tier5"

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, analysis_id: str):
        await websocket.accept()
        self.active_connections[analysis_id] = websocket

    def disconnect(self, analysis_id: str):
        if analysis_id in self.active_connections:
            del self.active_connections[analysis_id]

    async def send_update(self, analysis_id: str, message: dict):
        if analysis_id in self.active_connections:
            try:
                await self.active_connections[analysis_id].send_text(json.dumps(message))
            except:
                # Connection might be closed
                self.disconnect(analysis_id)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Ecommerce Intelligence API is running"}

@app.post("/api/analyze")
async def upload_and_analyze(
    file: UploadFile = File(...),
    api_tier: str = Form("tier7")
):
    """Upload CSV file and start OpenAI categorization analysis"""
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Generate unique analysis ID
    analysis_id = f"analysis_{uuid.uuid4().hex[:8]}"
    
    try:
        # Read the uploaded file content with proper encoding handling
        content = await file.read()
        # Handle BOM and encoding issues
        try:
            csv_content = content.decode('utf-8-sig')  # utf-8-sig removes BOM automatically
        except UnicodeDecodeError:
            # Fallback to regular utf-8
            csv_content = content.decode('utf-8')
        
        # Parse CSV to get product count for progress tracking
        df = pd.read_csv(StringIO(csv_content))
        
        # Remove last 2 rows (summary rows) like in your parseCSVFile function
        df = df.iloc[:-2]
        
        total_products = len(df)
        
        # Store job info
        analysis_jobs[analysis_id] = {
            "id": analysis_id,
            "status": "queued",
            "progress": 0,
            "message": "Analysis queued...",
            "startTime": time.time(),
            "totalProducts": total_products,
            "processedProducts": 0,
            "csv_content": csv_content,
            "api_tier": api_tier,
            "data": None,
            "error": None
        }
        
        # Start the analysis task in the background
        asyncio.create_task(process_analysis(analysis_id, csv_content, api_tier))
        
        return {"analysisId": analysis_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

async def process_analysis(analysis_id: str, csv_content: str, api_tier: str):
    """Background task to process the CSV with OpenAI categorization"""
    
    try:
        # Update status to processing
        analysis_jobs[analysis_id].update({
            "status": "processing",
            "message": f"Processing with OpenAI {api_tier} settings...",
            "progress": 5
        })
        await manager.send_update(analysis_id, {
            "type": "status_update",
            "data": analysis_jobs[analysis_id]
        })
        
        # Create temporary file for category_gen.py to process
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(csv_content)
            temp_file_path = temp_file.name
        
        try:
            # Parse the CSV data
            df = pd.read_csv(StringIO(csv_content))
            df = df.iloc[:-2]  # Remove summary rows
            
            print(f"🚀 Starting OpenAI categorization for {len(df)} products using {api_tier}")
            
            # Update progress
            analysis_jobs[analysis_id].update({
                "progress": 10,
                "message": f"🚀 Initializing OpenAI tier-5 processing for {len(df)} products..."
            })
            await manager.send_update(analysis_id, {
                "type": "status_update", 
                "data": analysis_jobs[analysis_id]
            })
            
            # Create progress callback for real-time updates
            async def update_progress(processed, total, progress_percent, custom_message=None):
                message = custom_message or f"🚀 Processing... {processed}/{total} products ({progress_percent}%)"
                analysis_jobs[analysis_id].update({
                    "progress": progress_percent,
                    "processedProducts": processed,
                    "message": message
                })
                await manager.send_update(analysis_id, {
                    "type": "progress_update",
                    "data": analysis_jobs[analysis_id]
                })
            
            # Use your real category_gen function with tier settings and progress tracking
            start_time = time.time()
            categorized_df = await generate_categories(df, api_tier, progress_callback=update_progress)
            end_time = time.time()
            
            processing_time = end_time - start_time
            processing_rate = len(df) / processing_time * 60  # products per minute
            
            print(f"✅ Categorization completed in {processing_time:.2f} seconds")
            print(f"⚡ Processing rate: {processing_rate:.0f} products/minute")
            
            # Convert DataFrame to the format expected by frontend
            products = categorized_df.to_dict('records')
            
            # Calculate analytics with NaN/infinity handling
            def safe_float(value):
                """Convert to float and handle NaN/infinity values"""
                try:
                    result = float(value or 0)
                    if not (result == result):  # Check for NaN
                        return 0.0
                    if result == float('inf') or result == float('-inf'):
                        return 0.0
                    return result
                except (ValueError, TypeError):
                    return 0.0
            
            total_revenue = sum(safe_float(p.get('Item Price', 0)) for p in products)
            total_profit = sum(safe_float(p.get('Net Seller Proceeds', 0)) for p in products)
            avg_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0.0
            avg_margin = safe_float(avg_margin)  # Ensure avg_margin is also safe
            
            # Category distribution
            category_dist = {}
            for product in products:
                category = product.get('openai_category', 'Unknown')
                revenue = safe_float(product.get('Item Price', 0))
                category_dist[category] = category_dist.get(category, 0.0) + revenue
            
            # Temporal patterns
            day_of_week = {}
            seasonal = {}
            for product in products:
                day = product.get('day_of_week', 'Unknown')
                season = product.get('season', 'Unknown')
                revenue = safe_float(product.get('Item Price', 0))
                day_of_week[day] = day_of_week.get(day, 0.0) + revenue
                seasonal[season] = seasonal.get(season, 0.0) + revenue
            
            # Geographic data
            state_revenue = {}
            for product in products:
                state = product.get('Shipped to State', 'Unknown')
                revenue = safe_float(product.get('Item Price', 0))
                state_revenue[state] = state_revenue.get(state, 0.0) + revenue
            
            # Sanitize all numeric values in the analytics
            def sanitize_dict(d):
                """Recursively sanitize a dictionary to ensure all float values are JSON-safe"""
                if isinstance(d, dict):
                    return {k: sanitize_dict(v) for k, v in d.items()}
                elif isinstance(d, list):
                    return [sanitize_dict(item) for item in d]
                elif isinstance(d, float):
                    return safe_float(d)
                else:
                    return d
            
            # Store the completed analysis
            dashboard_data = {
                "products": [sanitize_dict(p) for p in products],
                "analytics": sanitize_dict({
                    "totalRevenue": total_revenue,
                    "totalProfit": total_profit,
                    "totalItems": len(products),
                    "avgMargin": avg_margin,
                    "categoryDistribution": category_dist,
                    "temporalPatterns": {
                        "dayOfWeek": day_of_week,
                        "seasonal": seasonal,
                        "monthlyTrends": []  # Can be calculated if needed
                    },
                    "geographicData": {
                        "stateRevenue": state_revenue,
                        "regionRevenue": {}  # Can be calculated if needed
                    },
                    "recommendations": [
                        f"Processed {len(products)} products with OpenAI tier-5 in {processing_time:.1f} seconds",
                        f"Processing rate: {safe_float(processing_rate):.0f} products/minute",
                        f"Top category: {max(category_dist.items(), key=lambda x: x[1])[0] if category_dist else 'Unknown'}",
                        "AI categorization completed with structured outputs"
                    ]
                })
            }
            
            analysis_jobs[analysis_id].update({
                "status": "completed",
                "progress": 100,
                "message": f"✅ Analysis completed! Processed {len(products)} products in {processing_time:.1f}s",
                "endTime": time.time(),
                "processingRate": processing_rate,
                "processedProducts": len(products),
                "data": dashboard_data
            })
            
            await manager.send_update(analysis_id, {
                "type": "analysis_complete",
                "data": analysis_jobs[analysis_id]
            })
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        analysis_jobs[analysis_id].update({
            "status": "failed",
            "progress": 0,
            "message": f"Analysis failed: {str(e)}",
            "error": str(e)
        })
        
        await manager.send_update(analysis_id, {
            "type": "analysis_failed",
            "data": analysis_jobs[analysis_id]
        })

@app.get("/api/analysis/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    """Get the current status of an analysis job"""
    
    if analysis_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    job = analysis_jobs[analysis_id]
    
    return {
        "id": analysis_id,
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "startTime": job.get("startTime"),
        "endTime": job.get("endTime"),
        "processingRate": job.get("processingRate"),
        "totalProducts": job.get("totalProducts"),
        "processedProducts": job.get("processedProducts")
    }

@app.get("/api/analysis/{analysis_id}/data")
async def get_dashboard_data(analysis_id: str):
    """Get the dashboard data for a completed analysis"""
    
    if analysis_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    job = analysis_jobs[analysis_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Analysis not completed yet")
    
    if not job.get("data"):
        raise HTTPException(status_code=500, detail="Analysis data not available")
    
    return job["data"]

@app.websocket("/ws/analysis/{analysis_id}")
async def websocket_endpoint(websocket: WebSocket, analysis_id: str):
    """WebSocket endpoint for real-time analysis updates"""
    
    await manager.connect(websocket, analysis_id)
    
    try:
        # Send current status if analysis exists
        if analysis_id in analysis_jobs:
            await manager.send_update(analysis_id, {
                "type": "status_update",
                "data": analysis_jobs[analysis_id]
            })
        
        # Keep connection alive
        while True:
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(analysis_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 