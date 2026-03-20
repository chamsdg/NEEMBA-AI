# 🚀 Chamse IA Platform - Deployment Guide

## Development Setup (Local)

### 1. Prerequisites
- Python 3.10+
- Node.js 16+
- Git

### 2. Clone & Setup

```bash
# Windows
setup.bat

# Linux/Mac
chmod +x setup.sh
./setup.sh
```

### 3. Configure Environment

Edit `backend/.env`:
```env
SNOWFLAKE_ACCOUNT=your-account.snowflakecomputing.com
SNOWFLAKE_USER=your-user
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_WAREHOUSE=YOUR_WH
SNOWFLAKE_DATABASE=YOUR_DB
SNOWFLAKE_SCHEMA=YOUR_SCHEMA
SNOWFLAKE_PAT=your-pat-token
SECRET_KEY=your-secret-key
```

### 4. Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate
python -m uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Visit: http://localhost:3000

---

## Production Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

**Note:** Update `.env` with production credentials first

### Option 2: Heroku

#### Backend Deployment

```bash
# Create Heroku app
heroku create chamse-ia-platform-api

# Set environment variables
heroku config:set \
  DATABASE_URL=postgresql://... \
  SNOWFLAKE_ACCOUNT=your-account \
  SNOWFLAKE_USER=your-user \
  SNOWFLAKE_PASSWORD=your-password \
  SNOWFLAKE_WAREHOUSE=YOUR_WH \
  SNOWFLAKE_DATABASE=YOUR_DB \
  SNOWFLAKE_SCHEMA=YOUR_SCHEMA \
  SNOWFLAKE_PAT=your-pat \
  SECRET_KEY=your-secret-key

# Deploy
git push heroku main
```

**Create `Procfile` in backend/:**
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
release: python -c "from app.models.database import Base; from app.core.database import engine; Base.metadata.create_all(bind=engine)"
```

#### Frontend Deployment

Use Vercel:
```bash
vercel deploy --prod
```

Or Netlify:
```bash
npm run build
# Drag & drop build/ folder to Netlify
```

### Option 3: AWS

#### ECS (Elastic Container Service)

1. Build Docker images
2. Push to ECR (Elastic Container Registry)
3. Create ECS cluster and tasks
4. Setup RDS PostgreSQL
5. Allocate static IPs
6. Setup load balancer

#### EC2 (Self-hosted)

```bash
# SSH into EC2
ssh -i key.pem ec2-user@your-instance

# Install dependencies
sudo yum update -y
sudo yum install python3 git nodejs -y

# Clone repo
git clone <repo>
cd Chamse_IA_Platform

# Install & run
source setup.sh

# Setup PM2 (process manager)
npm install -g pm2
pm2 start app.main:app --name chamse-api
pm2 startup
pm2 save

# Setup Nginx as reverse proxy
# Edit /etc/nginx/nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    
    location /api {
        proxy_pass http://localhost:8000;
    }
    
    location / {
        proxy_pass http://localhost:3000;
    }
}

sudo nginx -s reload
```

### Option 4: Railway.app (Easiest)

```bash
# Login
railway login

# Initialize
railway init

# Create environment
railway up

# Deploy
git push
```

---

## Database Migration

### SQLite → PostgreSQL

```bash
# 1. Install pgloader
pgloader sqlite:///chamse_ia.db postgresql://user:pass@localhost/chamse_ia_db

# 2. Update .env
DATABASE_URL=postgresql://user:password@localhost/chamse_ia_db

# 3. Restart backend
```

---

## Monitoring & Logging

### Using ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# Add to docker-compose.yml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
```

### Using Sentry for Error Tracking

```python
# In app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()]
)
```

---

## Performance Optimization

1. **Frontend Caching**
   ```nginx
   location /static {
       expires 30d;
       add_header Cache-Control "public, immutable";
   }
   ```

2. **Backend Caching**
   ```python
   from fastapi_cache2 import FastAPICache2
   from fastapi_cache2.backends.redis import RedisBackend
   
   @cached(expire=600)
   @app.get("/chat/conversations")
   async def get_conversations():
       ...
   ```

3. **Database Indexing**
   ```python
   # In models
   user_id = Column(String, ForeignKey("users.id"), index=True)
   conversation_id = Column(String, ForeignKey("conversations.id"), index=True)
   ```

4. **CDN**
   - Use CloudFront for static assets
   - Enable compression (gzip)
   - Minify CSS/JS

---

## Security Checklist

- [ ] Update `SECRET_KEY` in production
- [ ] Enable HTTPS/SSL
- [ ] Set CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Setup firewall rules
- [ ] Enable CSRF protection
- [ ] Use strong database passwords
- [ ] Regular security updates
- [ ] Enable audit logging

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "chamse-ia-platform-api"
        heroku_email: "your-email@example.com"
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 PID
```

### Database Connection Issues
```bash
# Test connection
psql -h localhost -U user -d chamse_ia_db
```

### CORS Errors
Check `CORS_ORIGINS` in `.env` matches frontend URL

### JWT Token Invalid
Check `SECRET_KEY` is same in all instances

---

## Support

- Documentation: See README.md
- Issues: github.com/your-repo/issues
- Contact: chamsedine@example.com
