import os
from dotenv import load_dotenv
from functools import lru_cache

load_dotenv()

class Settings:
    """Configuration générale"""
    
    # FastAPI
    app_name = "Chamse IA Platform"
    debug = os.getenv("DEBUG", "False") == "True"
    
    # JWT
    secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    algorithm = "HS256"
    access_token_expire_minutes = 30
    
    # Database
    database_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    
    # Snowflake
    snowflake_account = os.getenv("SNOWFLAKE_ACCOUNT", "")
    snowflake_user = os.getenv("SNOWFLAKE_USER", "")
    snowflake_password = os.getenv("SNOWFLAKE_PASSWORD", "")
    snowflake_warehouse = os.getenv("SNOWFLAKE_WAREHOUSE", "")
    snowflake_database = os.getenv("SNOWFLAKE_DATABASE", "")
    snowflake_schema = os.getenv("SNOWFLAKE_SCHEMA", "")
    snowflake_pat = os.getenv("SNOWFLAKE_PAT", "")
    agent_name = os.getenv("AGENT_NAME", "AGENT_EXPERT_ANALYTICS")
    
    # Microsoft Graph
    microsoft_tenant_id = os.getenv("MICROSOFT_TENANT_ID", "")
    microsoft_client_id = os.getenv("MICROSOFT_CLIENT_ID", "")
    microsoft_client_secret = os.getenv("MICROSOFT_CLIENT_SECRET", "")
    
    # CORS
    cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]

@lru_cache()
def get_settings():
    return Settings()
