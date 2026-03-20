import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon, PencilIcon, ArrowRightIcon, EyeIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import AgentForm from '../components/AgentForm';
import './CustomAgentPage.css';

function CustomAgentPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [previewAgent, setPreviewAgent] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les agents personnalisés depuis localStorage
  useEffect(() => {
    loadCustomAgents();
  }, []);

  const loadCustomAgents = () => {
    const saved = localStorage.getItem('customAgents');
    if (saved) {
      setAgents(JSON.parse(saved));
    }
  };

  const saveAgents = (updatedAgents) => {
    localStorage.setItem('customAgents', JSON.stringify(updatedAgents));
    setAgents(updatedAgents);
  };

  const handleCreateAgent = (agentData) => {
    const newAgent = {
      id: `CUSTOM_${Date.now()}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      ...agentData
    };
    const updatedAgents = [...agents, newAgent];
    saveAgents(updatedAgents);
    setShowForm(false);
    setEditingAgent(null);
  };

  const handleUpdateAgent = (agentData) => {
    const updatedAgents = agents.map(agent =>
      agent.id === editingAgent.id 
        ? { ...agent, ...agentData, updatedAt: new Date().toISOString() } 
        : agent
    );
    saveAgents(updatedAgents);
    setEditingAgent(null);
    setShowForm(false);
  };

  const handleDeleteAgent = (agentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
      const updatedAgents = agents.filter(agent => agent.id !== agentId);
      saveAgents(updatedAgents);
    }
  };

  const handleDuplicateAgent = (agent) => {
    const duplicatedAgent = {
      ...agent,
      id: `CUSTOM_${Date.now()}`,
      name: `${agent.name} (copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };
    const updatedAgents = [...agents, duplicatedAgent];
    saveAgents(updatedAgents);
    setCopiedId(duplicatedAgent.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAgent(null);
  };

  const handleStartChat = (agent) => {
    // Augmenter le compteur d'utilisation
    const updatedAgents = agents.map(a =>
      a.id === agent.id ? { ...a, usageCount: (a.usageCount || 0) + 1 } : a
    );
    saveAgents(updatedAgents);
    navigate(`/chat?agent=${agent.id}`);
  };

  // Filtrer les agents selon la recherche
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClass = (color) => {
    const colorMap = {
      'blue': 'color-blue',
      'purple': 'color-purple',
      'pink': 'color-pink',
      'green': 'color-green',
      'orange': 'color-orange'
    };
    return colorMap[color] || 'color-blue';
  };

  return (
    <div className="custom-agent-page">
      <div className="agents-header">
        <div className="header-content">
          <h1>⚙️ Mes Agents IA</h1>
          <p>Créez et gérez vos agents personnalisés avec prompts personnalisés</p>
        </div>
      </div>

      <div className="custom-agent-container">
        {showForm ? (
          <div className="form-section">
            <AgentForm
              agent={editingAgent}
              onSubmit={editingAgent ? handleUpdateAgent : handleCreateAgent}
              onCancel={handleCancelForm}
            />
          </div>
        ) : (
          <>
            <div className="agents-top-section">
              <button
                className="create-agent-btn primary"
                onClick={() => setShowForm(true)}
              >
                <PlusIcon className="btn-icon" />
                <span>Créer un nouvel agent</span>
              </button>

              {agents.length > 0 && (
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Rechercher un agent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              )}
            </div>

            <div className="agents-list-section">
              <div className="agents-stats">
                <h2>Mes agents personnalisés</h2>
                {agents.length > 0 && (
                  <div className="agents-count">
                    {filteredAgents.length}/{agents.length} agent(s)
                  </div>
                )}
              </div>

              {agents.length === 0 ? (
                <div className="empty-agents">
                  <div className="empty-icon">⚙️</div>
                  <h3>Aucun agent créé</h3>
                  <p>Commencez par créer votre premier agent personnalisé</p>
                  <button
                    className="empty-create-btn"
                    onClick={() => setShowForm(true)}
                  >
                    Créer mon premier agent
                  </button>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="no-results">
                  <p>Aucun agent ne correspond à votre recherche</p>
                </div>
              ) : (
                <div className="agents-list-grid">
                  {filteredAgents.map(agent => (
                    <div 
                      key={agent.id} 
                      className={`agent-card ${getColorClass(agent.color)} ${copiedId === agent.id ? 'copied' : ''}`}
                    >
                      {copiedId === agent.id && (
                        <div className="copy-badge">
                          <CheckIcon className="copy-icon" />
                          Copié
                        </div>
                      )}

                      <div className="agent-card-header">
                        <div className="agent-emoji-name">
                          <span className="agent-emoji">{agent.emoji || '🤖'}</span>
                          <div className="agent-name-section">
                            <h3 className="agent-name">{agent.name}</h3>
                            <small className="agent-id">ID: {agent.id.replace('CUSTOM_', '')}</small>
                          </div>
                        </div>
                      </div>

                      <div className="agent-card-body">
                        <p className="agent-description">{agent.description}</p>

                        <div className="agent-params">
                          <div className="param-item">
                            <span className="param-label">Température:</span>
                            <span className="param-value">{agent.temperature || '0.7'}</span>
                          </div>
                          <div className="param-item">
                            <span className="param-label">Tokens max:</span>
                            <span className="param-value">{agent.max_tokens || '2000'}</span>
                          </div>
                        </div>

                        {agent.features && agent.features.length > 0 && (
                          <div className="agent-features">
                            <label>Fonctionnalités:</label>
                            <div className="features-tags">
                              {agent.features.map((feature, idx) => (
                                <span key={idx} className="feature-tag">{feature}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="agent-meta">
                          <small className="meta-item">
                            Créé: {new Date(agent.createdAt).toLocaleDateString('fr-FR')}
                          </small>
                          <small className="meta-item">
                            Utilisations: {agent.usageCount || 0}
                          </small>
                        </div>
                      </div>

                      <div className="agent-card-actions">
                        <button
                          className="action-btn preview-btn"
                          onClick={() => setPreviewAgent(agent)}
                          title="Aperçu"
                        >
                          <EyeIcon className="action-icon" />
                        </button>
                        <button
                          className="action-btn duplicate-btn"
                          onClick={() => handleDuplicateAgent(agent)}
                          title="Dupliquer"
                        >
                          <DocumentDuplicateIcon className="action-icon" />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditAgent(agent)}
                          title="Modifier"
                        >
                          <PencilIcon className="action-icon" />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteAgent(agent.id)}
                          title="Supprimer"
                        >
                          <TrashIcon className="action-icon" />
                        </button>
                      </div>

                      <button
                        className="use-agent-btn"
                        onClick={() => handleStartChat(agent)}
                      >
                        Utiliser cet agent
                        <ArrowRightIcon className="btn-arrow" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal d'aperçu */}
      {previewAgent && (
        <div className="modal-overlay" onClick={() => setPreviewAgent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{previewAgent.emoji} {previewAgent.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setPreviewAgent(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="preview-section">
                <h4>Description</h4>
                <p>{previewAgent.description}</p>
              </div>
              <div className="preview-section">
                <h4>Prompt système</h4>
                <pre className="prompt-preview">{previewAgent.prompt}</pre>
              </div>
              <div className="preview-params">
                <div className="param">
                  <span>Température:</span> {previewAgent.temperature || '0.7'}
                </div>
                <div className="param">
                  <span>Max tokens:</span> {previewAgent.max_tokens || '2000'}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn secondary"
                onClick={() => setPreviewAgent(null)}
              >
                Fermer
              </button>
              <button 
                className="btn primary"
                onClick={() => {
                  setPreviewAgent(null);
                  handleStartChat(previewAgent);
                }}
              >
                Utiliser cet agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomAgentPage;
