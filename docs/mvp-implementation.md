# 🚀 MVP Implementation Plan

## 🎯 MVP Goal
Convert current single-user application into a multi-user SaaS platform where Mercari sellers can upload their data and get AI-powered insights.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Pipeline   │
│                 │    │                 │    │                 │
│ • File Upload   │◄──►│ • User Auth     │◄──►│ • OpenAI API    │
│ • Dashboard     │    │ • File Processing│    │ • Clustering    │
│ • Billing       │    │ • Database      │    │ • Confidence    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📝 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Uploads Table
```sql
CREATE TABLE uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    total_items INTEGER,
    processed_items INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER REFERENCES uploads(id),
    user_id INTEGER REFERENCES users(id),
    item_id VARCHAR(255),
    item_title TEXT,
    item_price DECIMAL(10,2),
    sold_date DATE,
    shipped_to_state VARCHAR(50),
    net_seller_proceeds DECIMAL(10,2),
    openai_category VARCHAR(255),
    openai_subcategory VARCHAR(255),
    confidence_score DECIMAL(3,3),
    cluster_label INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Tech Stack

### Backend: FastAPI
```python
# main.py
from fastapi import FastAPI, UploadFile, Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from services import process_upload_async

app = FastAPI(title="Mercari Intelligence API")

@app.post("/upload")
async def upload_file(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save file and queue processing
    upload = create_upload_record(file, current_user.id, db)
    process_upload_async.delay(upload.id)
    return {"upload_id": upload.id, "status": "queued"}

@app.get("/dashboard/{upload_id}")
async def get_dashboard_data(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Return processed data for dashboard
    pass
```

### Frontend: Streamlit with Multi-User Support
```python
# app.py
import streamlit as st
import requests
from auth import authenticate_user, get_auth_token

def main():
    if 'auth_token' not in st.session_state:
        show_login_page()
    else:
        show_dashboard()

def show_login_page():
    st.title("🛍️ Mercari Intelligence")
    
    tab1, tab2 = st.tabs(["Login", "Sign Up"])
    
    with tab1:
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        if st.button("Login"):
            token = authenticate_user(email, password)
            if token:
                st.session_state.auth_token = token
                st.rerun()

def show_dashboard():
    st.title("🛍️ Mercari Intelligence Dashboard")
    
    # File upload section
    uploaded_file = st.file_uploader("Upload Mercari Sales Report", type="csv")
    if uploaded_file:
        upload_response = upload_file(uploaded_file, st.session_state.auth_token)
        if upload_response:
            st.success("File uploaded! Processing in background...")
    
    # Show existing dashboards
    uploads = get_user_uploads(st.session_state.auth_token)
    for upload in uploads:
        if upload['status'] == 'completed':
            show_upload_dashboard(upload['id'])
```

## 🔄 Processing Pipeline

### Background Job Processing
```python
# tasks.py
from celery import Celery
from services.ai_processor import AIProcessor
from services.data_processor import DataProcessor

celery_app = Celery('mercari-intelligence')

@celery_app.task
def process_upload_async(upload_id: int):
    try:
        # Update status
        update_upload_status(upload_id, 'processing')
        
        # Load and process data
        upload = get_upload(upload_id)
        df = pd.read_csv(upload.file_path)
        
        # Apply AI processing
        ai_processor = AIProcessor(user_id=upload.user_id)
        processed_df = ai_processor.process_dataframe(df)
        
        # Save to database
        save_products_to_db(processed_df, upload_id, upload.user_id)
        
        # Update status
        update_upload_status(upload_id, 'completed')
        
        # Send notification email
        send_completion_email(upload.user_id)
        
    except Exception as e:
        update_upload_status(upload_id, 'failed')
        log_error(upload_id, str(e))
```

### AI Service with Rate Limiting
```python
# services/ai_processor.py
import openai
from ratelimit import limits, sleep_and_retry
import time

class AIProcessor:
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.client = openai.OpenAI()
    
    @sleep_and_retry
    @limits(calls=50, period=60)  # 50 calls per minute
    def get_category(self, title: str) -> tuple:
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Categorize this product..."},
                    {"role": "user", "content": title}
                ],
                temperature=0.3,
                max_tokens=50
            )
            
            # Parse response
            categories = response.choices[0].message.content.strip()
            # ... parsing logic
            
            return category, subcategory
            
        except Exception as e:
            return "Unknown", "Unknown"
    
    def process_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        # Apply clustering
        df = self.apply_clustering(df)
        
        # Apply AI categorization
        for idx, row in df.iterrows():
            category, subcategory = self.get_category(row['Item Title'])
            df.at[idx, 'openai_category'] = category
            df.at[idx, 'openai_subcategory'] = subcategory
            
            # Small delay to respect rate limits
            time.sleep(0.1)
        
        # Calculate confidence scores
        df = self.calculate_confidence_scores(df)
        
        return df
```

## 🔐 Authentication & Authorization

### JWT Authentication
```python
# auth.py
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(user_id: int) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def get_current_user(token: str = Depends(security)) -> User:
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

## 💳 Subscription Management

### Stripe Integration
```python
# billing.py
import stripe
from models import User

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def create_checkout_session(user_id: int, price_id: str):
    user = get_user_by_id(user_id)
    
    session = stripe.checkout.Session.create(
        customer_email=user.email,
        payment_method_types=['card'],
        line_items=[{
            'price': price_id,
            'quantity': 1,
        }],
        mode='subscription',
        success_url='https://yourdomain.com/success',
        cancel_url='https://yourdomain.com/cancel',
        metadata={'user_id': user_id}
    )
    
    return session.url

def handle_webhook(payload, sig_header):
    event = stripe.Webhook.construct_event(
        payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
    )
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']
        
        # Update user subscription
        update_user_subscription(user_id, 'pro')
        
    return {"status": "success"}
```

## 📊 Usage Limits & Monitoring

### Subscription Limits
```python
# limits.py
SUBSCRIPTION_LIMITS = {
    'free': {
        'monthly_products': 100,
        'uploads_per_day': 3,
        'dashboard_access': True,
        'export_enabled': False
    },
    'pro': {
        'monthly_products': 2000,
        'uploads_per_day': 10,
        'dashboard_access': True,
        'export_enabled': True
    },
    'business': {
        'monthly_products': float('inf'),
        'uploads_per_day': float('inf'),
        'dashboard_access': True,
        'export_enabled': True
    }
}

def check_usage_limit(user_id: int, action: str) -> bool:
    user = get_user_by_id(user_id)
    limits = SUBSCRIPTION_LIMITS[user.subscription_tier]
    
    if action == 'upload':
        daily_uploads = get_daily_upload_count(user_id)
        return daily_uploads < limits['uploads_per_day']
    
    elif action == 'process_product':
        monthly_products = get_monthly_product_count(user_id)
        return monthly_products < limits['monthly_products']
    
    return True
```

## 🚀 Deployment Strategy

### Development Environment
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mercari_intelligence
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  streamlit:
    build: ./frontend
    ports:
      - "8501:8501"
    environment:
      - API_URL=http://api:8000

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=mercari_intelligence
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7

  worker:
    build: .
    command: celery -A tasks worker --loglevel=info
    depends_on:
      - db
      - redis
```

### Production Deployment (Railway)
```python
# Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
worker: celery -A tasks worker --loglevel=info
```

## 📈 Monitoring & Analytics

### Application Metrics
```python
# monitoring.py
from prometheus_client import Counter, Histogram, Gauge

# Metrics
upload_counter = Counter('uploads_total', 'Total uploads', ['status'])
processing_time = Histogram('processing_duration_seconds', 'Processing time')
active_users = Gauge('active_users', 'Active users')

def track_upload(status: str):
    upload_counter.labels(status=status).inc()

def track_processing_time(duration: float):
    processing_time.observe(duration)
```

## 🎯 MVP Feature Checklist

### Core Features
- [ ] User registration/login
- [ ] File upload with validation
- [ ] Background processing with progress tracking
- [ ] Multi-user dashboard
- [ ] Basic subscription tiers
- [ ] Stripe payment integration
- [ ] Usage limit enforcement

### Nice-to-Have
- [ ] Email notifications
- [ ] Data export functionality
- [ ] Admin dashboard
- [ ] Basic analytics tracking
- [ ] Error monitoring (Sentry)

## 🚦 Launch Strategy

### Beta Testing (Month 1)
1. Convert 5-10 existing Mercari sellers to beta testers
2. Free access in exchange for feedback
3. Iterate based on user feedback
4. Document common issues and solutions

### Public Launch (Month 2)
1. Launch with free tier to drive adoption
2. Content marketing on Reddit/social media
3. Collect user testimonials
4. Implement paid tiers

### Growth (Month 3+)
1. Referral program
2. Influencer partnerships
3. SEO optimization
4. Paid advertising campaigns

This MVP focuses on proving market fit while keeping development complexity manageable. The modular architecture allows for easy scaling as user base grows. 