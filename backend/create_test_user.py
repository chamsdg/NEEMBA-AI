#!/usr/bin/env python
"""Script pour créer un utilisateur de test"""

import sys
from app.core.database import engine
from app.models.database import Base, User
from app.services.auth_service import AuthService
from sqlalchemy.orm import sessionmaker

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

Session = sessionmaker(bind=engine)
session = Session()

try:
    # Vérifier si l'utilisateur existe déjà
    existing_user = session.query(User).filter(User.email == "demo@example.com").first()
    
    if existing_user:
        print("❌ Utilisateur demo@example.com existe déjà")
        sys.exit(0)
    
    # Créer l'utilisateur de test
    test_user = User(
        email="demo@example.com",
        username="demo",
        full_name="Demo User",
        hashed_password=AuthService.hash_password("Demo123!"),
        is_active=True,
        is_admin=True
    )
    
    session.add(test_user)
    session.commit()
    
    print("✅ Utilisateur créé avec succès !")
    print(f"📧 Email: demo@example.com")
    print(f"🔑 Mot de passe: Demo123!")
    print(f"👑 Rôle: Admin")
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    session.rollback()
    sys.exit(1)
finally:
    session.close()
