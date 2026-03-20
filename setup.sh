#!/bin/bash

echo ""
echo "========================================="
echo "  Chamse IA Platform - Setup"
echo "========================================="
echo ""

# Backend setup
echo "[1/4] Setting up Backend..."
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create database
echo "Creating database..."
python -c "from app.models.database import Base; from app.core.database import engine; Base.metadata.create_all(bind=engine)"

# Back to root
cd ..

# Frontend setup
echo "[2/4] Setting up Frontend..."
cd frontend

echo "Installing Node dependencies..."
npm install

cd ..

# Summary
echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "To start the platform:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python -m uvicorn app.main:app --reload"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Backend will run on: http://localhost:8000"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "Don't forget to:"
echo "  1. Create backend/.env with your Snowflake credentials"
echo "  2. Update SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, etc."
echo ""
