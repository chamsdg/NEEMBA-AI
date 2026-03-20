import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import './AgentsPage.css';

function AgentsPage() {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Mapping des avatars locaux pour chaque agent
  const avatarMap = {
    'Expert Analytics': '/avatars/expert-analytics.jpg',
    'Data Scientist': '/avatars/data-scientist.jpg',
    'Creative Assistant': '/avatars/creative-assistant.jpg',
    'Code Companion': '/avatars/code-companion.jpg'
  };

  // Liste des agents disponibles
  const agents = [
    {
      id: 'AGENT_EXPERT_ANALYTICS',
      name: 'Expert Analytics',
      description: 'Expert en analyse commerciale B2B pour Neemba. Analyse les données Snowflake avancée et génère des insights professionnels.',
      features: ['Analyse de données', 'Business Intelligence', 'Insights avancés', 'Rapports détaillés'],
      color: 'blue'
    },
    {
      id: 'AGENT_DATA_SCIENCE',
      name: 'Data Scientist',
      description: 'Spécialiste en science des données et machine learning. Effectue des analyses statistiques avancées et crée des modèles prédictifs.',
      features: ['Machine Learning', 'Statistiques', 'Prédictions', 'Modélisation'],
      color: 'purple',
      comingSoon: true
    },
    {
      id: 'AGENT_CREATIVE',
      name: 'Creative Assistant',
      description: 'Assistant créatif pour brainstorming et génération d\'idées innovantes. Aide à la création de contenu marketing et design thinking.',
      features: ['Brainstorming', 'Génération d\'idées', 'Contenu créatif', 'Design thinking'],
      color: 'pink',
      comingSoon: true
    },
    {
      id: 'AGENT_CODE',
      name: 'Code Companion',
      description: 'Développeur IA pour assistance à la programmation. Aide à écrire, déboguer et optimiser du code.',
      features: ['Programmation', 'Débogage', 'Optimisation', 'Architecture'],
      color: 'green',
      comingSoon: true
    },
  ].map(agent => ({
    ...agent,
    avatar: avatarMap[agent.name] || '/avatars/expert-analytics.jpg'
  }));

  const handleSelectAgent = (agent) => {
    if (!agent.comingSoon) {
      setSelectedAgent(agent);
    }
  };

  const handleStartChat = () => {
    if (selectedAgent) {
      navigate(`/chat?agent=${selectedAgent.id}`);
    }
  };

  return (
    <div className="agents-page">
      <div className="agents-header">
        <div className="header-content">
          <h1>🤖 Agents IA</h1>
          <p>Choisissez un agent pour démarrer une conversation</p>
        </div>
      </div>

      <div className="agents-container">
        <div className="agents-grid">
          {agents.map(agent => (
            <div
              key={agent.id}
              className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''} ${agent.comingSoon ? 'coming-soon' : ''}`}
              onClick={() => handleSelectAgent(agent)}
            >
              <div className="agent-avatar">
                <img 
                  src={agent.avatar} 
                  alt={agent.name}
                  className="avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div className="avatar-fallback">🤖</div>';
                  }}
                />
              </div>
              <h3 className="agent-name">{agent.name}</h3>
              <p className="agent-description">{agent.description}</p>
              
              <div className="agent-features">
                {agent.features.map((feature, idx) => (
                  <span key={idx} className="feature-tag">{feature}</span>
                ))}
              </div>

              {agent.comingSoon && (
                <div className="coming-soon-badge">Bientôt disponible</div>
              )}

              {selectedAgent?.id === agent.id && !agent.comingSoon && (
                <div className="agent-selected-indicator">
                  <SparklesIcon className="check-icon" />
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedAgent && !selectedAgent.comingSoon && (
          <div className="agent-action-panel">
            <div className="action-details">
              <h2>Prêt à discuter avec {selectedAgent.name} ?</h2>
              <p className="action-description">
                {selectedAgent.description}
              </p>
              <div className="action-features">
                {selectedAgent.features.map((feature, idx) => (
                  <div key={idx} className="feature-item">
                    <SparklesIcon className="feature-icon" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="start-chat-btn" onClick={handleStartChat}>
              <span>Démarrer une discussion</span>
              <ArrowRightIcon className="btn-icon" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentsPage;
