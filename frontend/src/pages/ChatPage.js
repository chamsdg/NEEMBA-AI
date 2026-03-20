import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { PaperAirplaneIcon, MagnifyingGlassIcon, TrashIcon, DocumentDuplicateIcon, ChatBubbleLeftIcon, SparklesIcon, PencilIcon, CheckIcon, XMarkIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import './ChatPage.css';

const API_BASE_URL = 'http://localhost:8000';
const MESSAGES_PER_PAGE = 10;

// Mapping des avatars 3D pour chaque agent
const agentAvatarMap = {
  'AGENT_EXPERT_ANALYTICS': {
    name: 'Expert Analytics',
    avatar: '/avatars/expert-analytics.jpg'
  },
  'AGENT_DATA_SCIENCE': {
    name: 'Data Scientist',
    avatar: '/avatars/data-scientist.jpg'
  },
  'AGENT_CREATIVE': {
    name: 'Creative Assistant',
    avatar: '/avatars/creative-assistant.jpg'
  },
  'AGENT_CODE': {
    name: 'Code Companion',
    avatar: '/avatars/code-companion.jpg'
  }
};

function ChatPage({ user }) {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('Nouvelle conversation');
  const [agentId, setAgentId] = useState('AGENT_EXPERT_ANALYTICS');
  const [loading, setLoading] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [copied, setCopied] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [customAgents, setCustomAgents] = useState([]);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  const token = localStorage.getItem('access_token');

  // Utilitaires audio
  const playBeep = (frequency = 800, duration = 150) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('Audio feedback non disponible');
    }
  };

  // Nettoyer et formater le texte reconnu
  const cleanRecognizedText = (text) => {
    if (!text) return '';
    // Supprimer les espaces multiples
    let cleaned = text.trim().replace(/\s+/g, ' ');
    // Capitaliser la première lettre
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
  };

  // Nettoyer le texte pour la synthèse vocale (supprimer emojis et caractères inutiles)
  const cleanTextForTTS = (text) => {
    if (!text) return '';
    
    // Supprimer les emojis et caractères spéciaux
    let cleaned = text
      // Emojis et symboles spéciaux
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis modernes
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Emojis supplémentaires
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Symboles divers
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      // Markdown
      .replace(/[*_`~\[\](){}#]/g, ' ')
      // Caractères spéciaux inutiles
      .replace(/[^\w\s.,:;!?àâäæèéêëìîïòôöœùûüç\-'&]/gi, ' ')
      // Nettoyage final
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
    
    return cleaned;
  };

  // Synthèse vocale
  const speakText = (text) => {
    if (!ttsEnabled) {
      console.log('TTS désactivée');
      return;
    }
    
    if (!text || text.trim().length === 0) {
      console.warn('Texte vide pour synthèse vocale');
      return;
    }
    
    try {
      // Arrêter la synthèse en cours
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        console.log('TTS: démarrage');
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        console.log('TTS: fin');
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error('TTS erreur:', event.error);
        setIsSpeaking(false);
      };
      
      console.log('TTS: lecture...', text.substring(0, 50));
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Erreur synthèse vocale:', error);
      setError('Erreur synthèse vocale: ' + error.message);
    }
  };

  // Charger les agents personnalisés au démarrage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('customAgents');
      if (saved) {
        setCustomAgents(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erreur chargement agents personnalisés:', error);
    }
  }, []);

  // Vérifier et renouveler le token si nécessaire
  useEffect(() => {
    const refreshTokenIfNeeded = async () => {
      const tokenExpiry = localStorage.getItem('token_expiry');
      if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        try {
          const email = localStorage.getItem('user_email');
          const password = localStorage.getItem('user_password'); // À éviter en prod
          if (email && password) {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('token_expiry', new Date(Date.now() + 30 * 60 * 1000).toISOString());
          }
        } catch (err) {
          console.error('Erreur renouvellement token:', err);
          setError('Session expirée. Veuillez vous reconnecter.');
        }
      }
    };
    refreshTokenIfNeeded();
    const interval = setInterval(refreshTokenIfNeeded, 60000); // Vérifier toutes les minutes
    return () => clearInterval(interval);
  }, []);

  // Afficher le message de bienvenue au chargement
  useEffect(() => {
    if (!conversationId && !welcomeShown && messages.length === 0) {
      // Récupérer le nom de l'utilisateur depuis localStorage
      let userName = 'ami';
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.full_name) {
          userName = userData.full_name.split(' ')[0];  // Récupérer le prénom
        } else if (userData.username) {
          userName = userData.username.split(' ')[0];
        } else if (userData.email) {
          userName = userData.email.split('@')[0];
        }
      } catch (error) {
        console.error('Erreur récupération user:', error);
      }
      
      const welcomeMessage = {
        id: 'welcome-' + Date.now(),
        role: 'welcome',
        content: `👋 Bonjour **${userName}**, comment je peux vous aider?`,
        created_at: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      setTotalMessages(1);
      setWelcomeShown(true);
    }
  }, [conversationId, welcomeShown, messages.length]);

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR';
      
      recognition.onstart = () => {
        setIsListening(true);
        playBeep(600, 100); // Son de démarrage
      };
      
      recognition.onend = () => {
        setIsListening(false);
        playBeep(1000, 100); // Son d'arrêt
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          const cleanedText = cleanRecognizedText(finalTranscript);
          setInput(prev => prev + cleanedText + ' ');
          playBeep(800, 50); // Son de confirmation
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Erreur reconnaissance vocale:', event.error);
        setError('Erreur de reconnaissance vocale: ' + event.error);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition API non supportée');
    }
  }, []);

  const handleMicrophoneClick = () => {
    if (!recognitionRef.current) {
      setError('Reconnaissance vocale non supportée par votre navigateur');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      recognitionRef.current.start();
    }
  };

  const handleTTSToggle = () => {
    const newState = !ttsEnabled;
    setTtsEnabled(newState);
    
    // Test audio si activation
    if (newState) {
      playBeep(800, 100);
      // Test de synthèse vocale
      setTimeout(() => {
        try {
          const testUtterance = new SpeechSynthesisUtterance('Synthèse vocale activée');
          testUtterance.lang = 'fr-FR';
          testUtterance.rate = 0.95;
          window.speechSynthesis.speak(testUtterance);
        } catch (error) {
          console.error('Erreur synthèse vocale:', error);
          setError('Synthèse vocale non supportée');
        }
      }, 150);
    }
  };

  // Obtenir les suggestions de questions selon l'agent
  const getSuggestedQuestions = (agent) => {
    const suggestions = {
      'AGENT_EXPERT_ANALYTICS': [
        '📊 Analyse les tendances de ventes du dernier trimestre',
        '💹 Quels sont les top 5 KPIs à surveiller ?',
        '📈 Comment optimiser la performance ?',
        '🔍 Identifie les anomalies dans les données'
      ],
      'AGENT_DATA_SCIENCE': [
        '🤖 Quels modèles de ML devrais-je utiliser ?',
        '📊 Comment préparer les données ?',
        '🔮 Fais une prédiction sur les données',
        '🧪 Effectue une analyse statistique'
      ],
      'AGENT_CREATIVE': [
        '🎨 Génère une campagne marketing créative',
        '✍️ Écris un contenu engageant',
        '💡 Des idées pour ce projet ?',
        '🎯 Comment captiver l\'audience ?'
      ],
      'AGENT_CODE': [
        '💻 Aide-moi à déboguer ce code',
        '🔧 Comment implémenter cette feature ?',
        '📝 Optimise ce code',
        '🚀 Comment déployer cette solution ?'
      ]
    };
    return suggestions[agent] || suggestions['AGENT_EXPERT_ANALYTICS'];
  };

  // Traiter une suggestion de question
  const handleSuggestedQuestion = (question) => {
    // Enlever l'emoji et nettoyer la question
    const cleanQuestion = question.replace(/^[^\w\s]*\s*/, '').trim();
    setInput(cleanQuestion);
    // Envoyer directement
    setTimeout(() => {
      const form = document.querySelector('.chat-input-form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
    }, 100);
  };

  // Changer l'agent et mettre à jour le rendu
  const handleAgentSelect = (newAgentId) => {
    setAgentId(newAgentId);
  };

  const loadExistingConversation = useCallback(async (convId) => {
    try {
      setLoading(true);
      setConversationId(convId);
      
      const response = await axios.get(
        `${API_BASE_URL}/chat/conversations/${convId}/messages`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Nettoyer le contenu des messages (strip les espaces)
      const cleanedMessages = response.data.map(msg => ({
        ...msg,
        content: msg.content ? msg.content.trim() : msg.content
      }));
      
      setMessages(cleanedMessages);
      setTotalMessages(cleanedMessages.length);
      setCurrentPage(Math.ceil(cleanedMessages.length / MESSAGES_PER_PAGE));
      setError('');
    } catch (err) {
      console.error('Erreur chargement conversation:', err);
      setError('Erreur lors du chargement de la conversation');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const agent = searchParams.get('agent');
    if (agent) {
      setAgentId(agent);
    }

    const convId = searchParams.get('conversation');
    if (convId) {
      loadExistingConversation(convId);
    }
  }, [searchParams, loadExistingConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createConversation = async (firstMessage) => {
    try {
      if (!token) {
        setError('Pas d\'authentification. Veuillez vous reconnecter.');
        return null;
      }
      
      // Générer le titre automatiquement à partir du premier message
      const autoTitle = firstMessage.length > 50 
        ? firstMessage.substring(0, 47) + '...' 
        : firstMessage;
      
      const response = await axios.post(
        `${API_BASE_URL}/chat/conversations`,
        { 
          title: autoTitle,
          agent_id: agentId
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setConversationId(response.data.id);
      setConversationTitle(autoTitle);
      return response.data.id;
    } catch (err) {
      console.error('Erreur création conversation:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Erreur lors de la création de la conversation');
      return null;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    let convId = conversationId;
    if (!convId) {
      convId = await createConversation(input);
      if (!convId) return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setTotalMessages(prev => prev + 1);
    setInput('');
    setSending(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chat/conversations/${convId}/ask`,
        { content: input },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const agentMessage = {
        id: response.data.message_id || Date.now().toString(),
        role: 'agent',
        content: (response.data.response || 'Réponse reçue').trim(),
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMessage]);
      setTotalMessages(prev => prev + 1);
      
      // Synthèse vocale de la réponse
      if (ttsEnabled && agentMessage.content) {
        console.log('[TTS] Activation TTS, contenu:', agentMessage.content.substring(0, 50));
        setTimeout(() => {
          const plainText = cleanTextForTTS(agentMessage.content);
          
          if (plainText.length > 0) {
            console.log('[TTS] Lecture:', plainText.substring(0, 50));
            speakText(plainText);
          } else {
            console.warn('[TTS] Texte vide après nettoyage');
          }
        }, 300);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Erreur lors de l\'envoi du message';
      setError(errMsg);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: errMsg,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleCopyMessage = (content, messageId) => {
    navigator.clipboard.writeText(content);
    setCopied(messageId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleStartEdit = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async (messageId) => {
    if (!editingContent.trim()) {
      alert('Le message ne peut pas être vide');
      return;
    }
    
    try {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: editingContent.trim() } : m
      ));
      // Mettre la question modifiée dans le champ d'input
      setInput(editingContent.trim());
      setEditingMessageId(null);
      setEditingContent('');
    } catch (err) {
      console.error('Erreur édition:', err);
      setError('Erreur lors de l\'édition du message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    
    try {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setTotalMessages(prev => prev - 1);
      // Optionnel: appel API pour supprimer côté serveur
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression du message');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarColor = (role) => {
    if (role === 'agent' || role === 'welcome') return '#fec900';
    if (role === 'user') return '#1d1d1b';
    return '#ef4444';
  };

  const getInitials = (role) => {
    if (role === 'agent' || role === 'welcome') return 'IA';
    if (role === 'user') return '';
    return 'E';
  };

  // Pagination
  const startIdx = (currentPage - 1) * MESSAGES_PER_PAGE;
  const endIdx = startIdx + MESSAGES_PER_PAGE;
  const displayedMessages = messages.slice(startIdx, endIdx);
  const totalPages = Math.ceil(totalMessages / MESSAGES_PER_PAGE);

  return (
    <div className="chat-page">
      {loading ? (
        <div className="empty-state">
          <div className="loading-message">Chargement de la conversation...</div>
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <ChatBubbleLeftIcon className="w-20 h-20" />
          </div>
          <h2>Bonjour {user?.full_name?.split(' ')[0]}.</h2>
          <p>Que souhaites-tu demander à kone ?</p>
          
          {/* Sélecteur d'agents */}
          <div className="agents-selector-section">
            <h3 className="selector-title">Choisis un agent</h3>
            <div className="agents-selector-grid">
              {/* Agents prédéfinis */}
              {[
                { id: 'AGENT_EXPERT_ANALYTICS', name: 'Expert Analytics', emoji: '📊' },
                { id: 'AGENT_DATA_SCIENCE', name: 'Data Scientist', emoji: '🤖' },
                { id: 'AGENT_CREATIVE', name: 'Creative', emoji: '🎨' },
                { id: 'AGENT_CODE', name: 'Code', emoji: '💻' }
              ].map(agent => (
                <button
                  key={agent.id}
                  className={`agent-selector-btn ${agentId === agent.id ? 'active' : ''}`}
                  onClick={() => handleAgentSelect(agent.id)}
                >
                  <span className="agent-emoji-select">{agent.emoji}</span>
                  <span className="agent-name-select">{agent.name}</span>
                </button>
              ))}
              
              {/* Agents personnalisés */}
              {customAgents.length > 0 && (
                <>
                  {customAgents.slice(0, 4).map(agent => (
                    <button
                      key={agent.id}
                      className={`agent-selector-btn custom-agent-btn ${agentId === agent.id ? 'active' : ''}`}
                      onClick={() => handleAgentSelect(agent.id)}
                      title={agent.name}
                    >
                      <span className="agent-emoji-select">{agent.emoji || '⚙️'}</span>
                      <span className="agent-name-select">{agent.name.substring(0, 12)}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Suggestions de questions */}
          <div className="suggestions-section">
            <h3 className="suggestions-title">Ou demande-moi...</h3>
            <div className="suggestions-grid">
              {getSuggestedQuestions(agentId).map((question, idx) => (
                <button
                  key={idx}
                  className="suggestion-btn"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '20px' }}>
            Parlez à l'IA avec des instructions précises pour obtenir les meilleurs résultats.
          </p>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-brand">
            <SparklesIcon className="brand-icon" />
            <span>Neemba AI</span>
          </div>
          <div className="chat-header">
            <div className="conversation-title-section">
              <SparklesIcon className="title-icon" />
              <h3>{conversationTitle}</h3>
            </div>
            <div className="neemba-badge">Neemba AI</div>
          </div>

          <div className="messages-list">
            {totalPages > 1 && currentPage < totalPages && (
              <button 
                className="load-more-btn"
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                ↑ Charger plus de messages ({(totalMessages - endIdx)} restants)
              </button>
            )}

            {displayedMessages.map(message => (
              <div
                key={message.id}
                className={`message-wrapper message-${message.role}`}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                <div className="message-avatar" style={{ backgroundColor: message.role === 'user' || message.role === 'error' ? getAvatarColor(message.role) : 'transparent' }}>
                  {message.role === 'agent' || message.role === 'welcome' ? (
                    <img 
                      src={agentAvatarMap[agentId]?.avatar} 
                      alt="Agent avatar"
                      className="avatar-image-chat"
                    />
                  ) : (
                    getInitials(message.role)
                  )}
                </div>

                <div className="message-content-wrapper">
                  <div className="message-header">
                    <span className="message-role">
                      {message.role === 'agent' || message.role === 'welcome' ? 'kone' : 'Vous'}
                    </span>
                    <span className="message-time">{formatTime(message.created_at)}</span>
                  </div>

                  {message.role === 'user' && (
                    editingMessageId === message.id ? (
                      <div className="message message-edit">
                        <textarea
                          className="edit-textarea"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button 
                            className="edit-save-btn"
                            onClick={() => handleSaveEdit(message.id)}
                          >
                            <CheckIcon className="action-icon" /> Sauvegarder
                          </button>
                          <button 
                            className="edit-cancel-btn"
                            onClick={handleCancelEdit}
                          >
                            <XMarkIcon className="action-icon" /> Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="message message-user">
                        <p>{message.content}</p>
                      </div>
                    )
                  )}
                  {message.role === 'agent' && (
                    <div className="message message-agent">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {message.role === 'welcome' && (
                    <div className="message message-welcome">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {message.role === 'error' && (
                    <div className="message message-error">
                      <p>⚠️ {message.content}</p>
                    </div>
                  )}

                  {hoveredMessageId === message.id && message.role !== 'error' && message.role !== 'welcome' && editingMessageId !== message.id && (
                    <div className="message-actions">
                      {message.role === 'user' && (
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleStartEdit(message.id, message.content)}
                          title="Éditer"
                        >
                          <PencilIcon className="action-icon" />
                        </button>
                      )}
                      <button
                        className="action-btn copy-btn"
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        title="Copier"
                      >
                        {copied === message.id ? (
                          <span className="copied-text">✓ Copié</span>
                        ) : (
                          <DocumentDuplicateIcon className="action-icon" />
                        )}
                      </button>
                      {message.role === 'user' && (
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteMessage(message.id)}
                          title="Supprimer"
                        >
                          <TrashIcon className="action-icon" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="thinking-container">
                <div className="thinking-content">
                  <div className="thinking-avatar">
                    <img 
                      src={agentAvatarMap[agentId]?.avatar} 
                      alt="Agent avatar"
                      className="thinking-avatar-image"
                    />
                  </div>
                  <h3 className="thinking-title">{agentAvatarMap[agentId]?.name} réfléchit...</h3>
                  <div className="thinking-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p className="thinking-subtitle">Veuillez patienter</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Écrivez votre requête ici..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={sending || !input.trim()}
            title="Envoyer (Ctrl+Entrée)"
          >
            <PaperAirplaneIcon className="tool-icon" />
          </button>
        </div>
        <div className="input-tools">
          <button 
            type="button" 
            className={`tool-btn ${isListening ? 'recording' : ''}`}
            onClick={handleMicrophoneClick}
            title={isListening ? 'Arrêter l\'enregistrement' : 'Activer le microphone'}
          >
            <MicrophoneIcon className="tool-icon" />
          </button>
          <button 
            type="button" 
            className={`tool-btn ${ttsEnabled ? 'tts-active' : ''}`}
            onClick={handleTTSToggle}
            title={ttsEnabled ? 'Désactiver la synthèse vocale' : 'Activer la synthèse vocale'}
          >
            <SpeakerWaveIcon className="tool-icon" />
          </button>
          <button type="button" className="tool-btn disabled" title="Pièce jointe (bientôt disponible)" disabled>
            <MagnifyingGlassIcon className="tool-icon" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatPage;
