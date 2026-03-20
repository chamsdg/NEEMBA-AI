import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChatBubbleBottomCenterTextIcon, SparklesIcon, BookOpenIcon, ChatBubbleLeftIcon, FireIcon, LightBulbIcon, ClockIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import './DashboardPage.css';

const API_BASE_URL = 'http://localhost:8000';

function DashboardPage({ user }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [customAgents, setCustomAgents] = useState([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    customAgents: 0,
    totalTime: 0
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les conversations
      const convResponse = await axios.get(`${API_BASE_URL}/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setConversations(convResponse.data);

      // Charger les agents personnalisés
      const saved = localStorage.getItem('customAgents');
      const agents = saved ? JSON.parse(saved) : [];
      setCustomAgents(agents);

      // Calculer les statistiques
      let totalMessages = 0;
      let totalTimeMinutes = 0;

      for (const conv of convResponse.data) {
        try {
          const messagesResponse = await axios.get(
            `${API_BASE_URL}/chat/conversations/${conv.id}/messages`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          const messages = messagesResponse.data;
          totalMessages += messages.length;

          // Calcul Hybrid du temps
          if (messages.length > 0) {
            // Récupérer les timestamps
            const firstTimestamp = new Date(messages[0].created_at).getTime();
            const lastTimestamp = new Date(messages[messages.length - 1].created_at).getTime();
            
            // Temps réel entre premier et dernier message (en minutes)
            const realTimeMinutes = Math.ceil((lastTimestamp - firstTimestamp) / (1000 * 60));
            
            // Ajouter une estimation pour les messages (1 min par 5 messages)
            const estimatedMinutes = Math.ceil(messages.length / 5);
            
            // Hybrid: maximum entre le temps réel et l'estimation
            const conversationTime = Math.max(realTimeMinutes, estimatedMinutes);
            
            // Minimum 1 minute par conversation
            totalTimeMinutes += Math.max(conversationTime, 1);
          }
        } catch (error) {
          console.log('Erreur chargement messages:', error);
          // En cas d'erreur, ajouter une estimation par défaut
          totalTimeMinutes += 5; // 5 minutes par défaut
        }
      }

      setStats({
        totalConversations: convResponse.data.length,
        totalMessages: totalMessages,
        customAgents: agents.length,
        totalTime: totalTimeMinutes
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const agentAvatarMap = {
    'AGENT_EXPERT_ANALYTICS': { name: 'Expert Analytics', emoji: '📊' },
    'AGENT_DATA_SCIENCE': { name: 'Data Scientist', emoji: '🔬' },
    'AGENT_CREATIVE': { name: 'Creative Assistant', emoji: '✨' },
    'AGENT_CODE': { name: 'Code Companion', emoji: '💻' }
  };

  const getMostUsedAgents = () => {
    // Triez les agents personnalisés par usageCount
    const sorted = [...customAgents].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    return sorted.slice(0, 4);
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getConversationPreview = (text) => {
    return text.substring(0, 50) + (text.length > 50 ? '...' : '');
  };

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-header">
          <div className="welcome-text">
            <h1>Bonjour {user?.full_name?.split(' ')[0]} 👋</h1>
            <p>Que souhaites-tu demander à Neemba AI ?</p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon conversations-icon">
              <ChatBubbleLeftIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalConversations}</div>
              <div className="stat-label">Conversations</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon messages-icon">
              <ChatBubbleBottomCenterTextIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalMessages}</div>
              <div className="stat-label">Messages</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon agents-icon">
              <SparklesIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.customAgents}</div>
              <div className="stat-label">Mes agents</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon time-icon">
              <ClockIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{formatTime(stats.totalTime)}</div>
              <div className="stat-label">Durée totale</div>
            </div>
          </div>
        </div>

        {/* Action Cards Améliorées */}
        <div className="action-cards-section">
          <h3>Démarrer</h3>
          <div className="action-cards">
            <button 
              className="action-card primary"
              onClick={() => navigate('/chat')}
            >
              <div className="card-icon-wrapper">
                <ChatBubbleBottomCenterTextIcon className="card-icon" />
              </div>
              <div className="card-content">
                <div className="card-title">Démarrer une conversation</div>
                <div className="card-subtitle">Chat avec l'agent par défaut</div>
              </div>
              <ArrowRightIcon className="card-arrow" />
            </button>

            <button 
              className="action-card secondary"
              onClick={() => navigate('/agents')}
            >
              <div className="card-icon-wrapper">
                <SparklesIcon className="card-icon" />
              </div>
              <div className="card-content">
                <div className="card-title">Choisir un agent IA</div>
                <div className="card-subtitle">Sélectionner un agent spécialisé</div>
              </div>
              <ArrowRightIcon className="card-arrow" />
            </button>

            <button 
              className="action-card tertiary"
              onClick={() => navigate('/my-agents')}
            >
              <div className="card-icon-wrapper">
                <LightBulbIcon className="card-icon" />
              </div>
              <div className="card-content">
                <div className="card-title">Créer un agent</div>
                <div className="card-subtitle">Personnaliser un agent</div>
              </div>
              <ArrowRightIcon className="card-arrow" />
            </button>
          </div>
        </div>
      </div>

      {/* Mes Agents Récents */}
      {getMostUsedAgents().length > 0 && (
        <div className="agents-recent-section">
          <div className="section-header">
            <h2>Mes agents les plus utilisés</h2>
            <Link to="/my-agents" className="view-all-link">Voir tous</Link>
          </div>
          <div className="agents-recent-grid">
            {getMostUsedAgents().map(agent => (
              <button
                key={agent.id}
                className="agent-recent-card"
                onClick={() => navigate(`/chat?agent=${agent.id}`)}
                style={{ borderLeftColor: `var(--color-${agent.color || 'blue'})` }}
              >
                <div className="agent-recent-header">
                  <span className="agent-recent-emoji">{agent.emoji || '🤖'}</span>
                  <div className="agent-recent-info">
                    <div className="agent-recent-name">{agent.name}</div>
                    <div className="agent-recent-usage">{agent.usageCount || 0} utilisations</div>
                  </div>
                </div>
                <div className="agent-recent-arrow">→</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversations Récentes Améliorées */}
      {conversations.length > 0 && (
        <div className="recent-section">
          <div className="section-header">
            <h2>Conversations récentes</h2>
            <Link to="/history" className="view-all-link">Voir l'historique</Link>
          </div>
          <div className="conversations-grid">
            {conversations.slice(0, 6).map(conv => (
              <Link
                key={conv.id}
                to={`/chat?conversation=${conv.id}`}
                className="conversation-card"
              >
                <div className="conv-header">
                  <div className="conv-agent">
                    {agentAvatarMap[conv.agent_id]?.emoji || '🤖'}
                  </div>
                  <div className="conv-agent-name">
                    {agentAvatarMap[conv.agent_id]?.name || conv.agent_id}
                  </div>
                </div>
                <div className="conv-body">
                  <div className="conv-title">{conv.title}</div>
                  <div className="conv-date">
                    {new Date(conv.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="conv-arrow">
                  <ArrowRightIcon className="arrow-icon" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
