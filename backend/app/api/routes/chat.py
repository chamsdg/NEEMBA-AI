from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.database import Conversation, Message, User
from app.schemas import ChatMessage, ChatResponse, ConversationCreate, ConversationResponse, MessageResponse
from app.services.snowflake_service import snowflake_service
from app.api.routes.auth import oauth2_scheme, get_current_user
import uuid
import json

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    conv_data: ConversationCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle conversation"""
    conversation = Conversation(
        id=str(uuid.uuid4()),
        user_id=current_user_id,
        title=conv_data.title,
        agent_id=conv_data.agent_id
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les conversations de l'utilisateur"""
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user_id,
        Conversation.is_archived == False
    ).order_by(Conversation.created_at.desc()).all()
    return conversations

@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages(
    conversation_id: str,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les messages d'une conversation"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()
    return messages

@router.post("/conversations/{conversation_id}/ask", response_model=ChatResponse)
def ask_agent(
    conversation_id: str,
    message_data: ChatMessage,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Poser une question à l'agent"""
    # Vérifier la conversation
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Enregistrer le message utilisateur
    user_message = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=message_data.content
    )
    db.add(user_message)
    db.commit()
    
    # Appeler l'agent
    result = snowflake_service.call_agent(message_data.content, conversation.agent_id)
    
    if result["status"] == "success":
        # Enregistrer la réponse
        agent_message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="agent",
            content=result["response"]
        )
        db.add(agent_message)
        db.commit()
        db.refresh(agent_message)
        
        return ChatResponse(
            status="success",
            response=result["response"],
            message_id=agent_message.id
        )
    else:
        raise HTTPException(status_code=500, detail=result["response"])

@router.post("/conversations/{conversation_id}/ask-stream")
def ask_agent_stream(
    conversation_id: str,
    message_data: ChatMessage,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Poser une question à l'agent avec streaming SSE"""
    # Vérifier la conversation
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Enregistrer le message utilisateur
    user_message = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=message_data.content
    )
    db.add(user_message)
    db.commit()
    
    # Créer message agent (sera complété par le stream)
    agent_message = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="agent",
        content=""  # Sera rempli progressivement
    )
    db.add(agent_message)
    db.commit()
    
    # Créer le générateur de streaming
    def event_generator():
        full_response = ""
        try:
            for chunk in snowflake_service.call_agent_stream(message_data.content, conversation.agent_id):
                full_response += chunk
                # Envoyer le chunk via SSE
                yield f"data: {json.dumps({'chunk': chunk, 'message_id': agent_message.id})}\n\n"
            
            # Sauvegarder la réponse complète
            agent_message.content = full_response
            db.commit()
            
            # Signal de fin
            yield f"data: {json.dumps({'done': True, 'message_id': agent_message.id})}\n\n"
        
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archiver une conversation"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    conversation.is_archived = True
    db.commit()
    return {"status": "archived"}
