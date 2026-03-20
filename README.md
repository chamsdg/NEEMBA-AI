# 🤖 Chamse IA Platform

Plateforme d'analyse avancée avec agents Cortex Snowflake. Authentification JWT, chat interactif, historique des conversations et dashboards modernes.

## 📋 Prérequis

- Python 3.10+
- Node.js 16+
- PostgreSQL (optionnel, SQLite pour dev)
- Compte Snowflake avec Cortex

## 🚀 Installation rapide

### 1. Backend (FastAPI)

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Créer les tables
python -c "from app.models.database import Base; from app.core.database import engine; Base.metadata.create_all(bind=engine)"

# Lancer le serveur
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (React)

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start
```

## 🔧 Configuration

### Backend (.env)

```
DEBUG=True
SECRET_KEY=your-secret-key-here

DATABASE_URL=sqlite:///./chamse_ia.db
# Pour PostgreSQL: postgresql://user:password@localhost/chamse_ia

SNOWFLAKE_ACCOUNT=your-account
SNOWFLAKE_USER=your-user
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_WAREHOUSE=your-warehouse
SNOWFLAKE_DATABASE=your-database
SNOWFLAKE_SCHEMA=your-schema
SNOWFLAKE_PAT=your-pat
AGENT_NAME=AGENT_EXPERT_ANALYTICS

CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📚 Architecture

```
Chamse_IA_Platform/
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── api/            # Routes (auth, chat)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── services/       # Business logic
│   │   ├── core/           # Config, database
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt
│   └── .env
│
└── frontend/               # React
    ├── src/
    │   ├── pages/         # Login, Dashboard, Chat
    │   ├── components/    # Reusable components
    │   ├── utils/         # Helpers
    │   ├── App.js         # Main App + routing
    │   └── index.js
    ├── public/
    └── package.json
```

## 🔐 Authentification

- JWT Bearer tokens
- Passwords hasées avec bcrypt
- Refresh tokens (à implémenter)

## 💬 API Endpoints

### Auth
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir le token

### Chat
- `GET /chat/conversations` - Récupérer les conversations
- `POST /chat/conversations` - Créer une conversation
- `GET /chat/conversations/{id}/messages` - Récupérer les messages
- `POST /chat/conversations/{id}/ask` - Poser une question
- `DELETE /chat/conversations/{id}` - Archiver

## 🎯 Features

✅ Authentification JWT
✅ Chat avec AGENT_EXPERT_ANALYTICS
✅ Historique des conversations
✅ Dashboard avec statistiques
✅ Interface responsive
✅ Markdown rendering avec tables
✅ Anti-doublons SSE streaming

## 📝 À faire

- [ ] Authentification OAuth2
- [ ] Upload de fichiers
- [ ] Export PDF/Excel
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Notifications
- [ ] Partage de conversations

## 🛠️ Développement

### Backend tests
```bash
pytest backend/tests/
```

### Frontend tests
```bash
npm test
```

### Build production
```bash
npm run build
```

## 📦 Déploiement

### Docker
```bash
docker-compose up -d
```

### Heroku
```bash
heroku create chamse-ia-platform
git push heroku main
```

### Vercel (Frontend)
```bash
vercel deploy
```

## 📄 License

MIT

## 👤 Contact

Pour des questions: chamsedine@example.com
