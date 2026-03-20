from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.database import User
from app.schemas import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import AuthService
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth2 scheme
oauth2_scheme = HTTPBearer()

# Dépendance pour vérifier le token
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré"
    )
    
    token = credentials.credentials
    payload = AuthService.decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    return user_id

@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Créer un nouvel utilisateur"""
    # Vérifier si l'email existe
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email déjà utilisé"
        )
    
    # Créer l'utilisateur
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=AuthService.hash_password(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Connecter un utilisateur"""
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not AuthService.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    # Créer le token
    access_token = AuthService.create_access_token(
        data={"sub": user.id, "email": user.email}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh_token(current_user_id: str = Depends(get_current_user)):
    """Rafraîchir le token"""
    access_token = AuthService.create_access_token(
        data={"sub": current_user_id}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user_id: str = Depends(get_current_user)):
    """Récupérer les infos de l'utilisateur actuel"""
    return {"user_id": current_user_id}
