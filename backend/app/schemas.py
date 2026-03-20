from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Auth
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Chat
class ChatMessage(BaseModel):
    content: str

class ChatResponse(BaseModel):
    status: str
    response: str
    message_id: Optional[str] = None

class ConversationCreate(BaseModel):
    title: str
    agent_id: str = "AGENT_EXPERT_ANALYTICS"

class ConversationResponse(BaseModel):
    id: str
    title: str
    agent_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: str
    role: str  # "user" ou "agent"
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True
