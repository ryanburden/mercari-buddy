#!/usr/bin/env python3
"""
Startup script for the Ecommerce Intelligence FastAPI backend
"""

import uvicorn
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

if __name__ == "__main__":
    print("🚀 Starting Ecommerce Intelligence API Server...")
    print("📡 Backend will be available at: http://localhost:8000")
    print("📋 API docs will be available at: http://localhost:8000/docs")
    print("🚀 Using OpenAI tier-7 LUDICROUS SPEED settings!")
    print("⚡ 5000 RPM | 500 Concurrent | 1000 Batch Size")
    print("💥 LUDICROUS FAST: ~0.2-1 second for 1000 products!")
    print("🔥 NO LIMITS MODE ACTIVATED!")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes during development
        log_level="info"
    ) 