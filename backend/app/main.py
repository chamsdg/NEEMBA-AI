from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.models.database import Base
from app.core.database import engine
from app.api.routes import auth, chat
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Chamse IA Platform",
    description="Plateforme d'analyse avec agents Cortex Snowflake",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(chat.router)

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name
    }

# Root
@app.get("/")
def root():
    return {
        "message": "Bienvenue sur Chamse IA Platform",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
