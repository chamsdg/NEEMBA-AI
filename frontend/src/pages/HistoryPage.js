import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrashIcon, MagnifyingGlassIcon, ClockIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import './HistoryPage.css';

const API_BASE_URL = 'http://localhost:8000';

function HistoryPage({ user }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [agentFilter, setAgentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchTerm, dateFilter, agentFilter]);

  // Debug info - MUST be before any conditional returns
  useEffect(() => {
    console.log('HistoryPage Debug:', {
      totalConversations: conversations.length,
      filteredCount: filteredConversations.length,
      searchTerm,
      dateFilter,
      agentFilter,
      conversations: conversations.map(c => ({ id: c.id, title: c.title }))
    });
  }, [conversations, filteredConversations, searchTerm, dateFilter, agentFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('Loading conversations...');
      const response = await axios.get(`${API_BASE_URL}/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Conversations loaded:', response.data.length);
      setConversations(response.data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueAgents = () => {
    return [...new Set(conversations.map(c => c.agent_id || 'AGENT_EXPERT_ANALYTICS'))];
  };

  const isDateInRange = (dateString, filter) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (filter) {
      case 'today':
        return diffDays === 0;
      case 'week':
        return diffDays <= 7;
      case 'month':
        return diffDays <= 30;
      default:
        return true;
    }
  };

  const filterConversations = () => {
    let filtered = conversations;

    console.log('Total conversations:', conversations.length);
    console.log('Search term:', searchTerm);

    // Filtrer par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(conv => {
        const title = (conv.title || '').toLowerCase();
        console.log('Comparing:', title, 'with:', term, 'match:', title.includes(term));
        return title.includes(term);
      });
    }

    // Filtrer par date
    if (dateFilter !== 'all') {
      filtered = filtered.filter(conv =>
        isDateInRange(conv.created_at, dateFilter)
      );
    }

    // Filtrer par agent
    if (agentFilter !== 'all') {
      filtered = filtered.filter(conv =>
        (conv.agent_id || 'AGENT_EXPERT_ANALYTICS') === agentFilter
      );
    }

    console.log('Filtered conversations:', filtered.length);
    setFilteredConversations(filtered);
  };

  const handleSelectConversation = (conversationId) => {
    navigate(`/chat?conversation=${conversationId}`);
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      try {
        await axios.delete(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setConversations(conversations.filter(c => c.id !== conversationId));
      } catch (err) {
        console.error('Erreur suppression:', err);
        setError('Erreur lors de la suppression');
      }
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setAgentFilter('all');
    setShowFilters(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Réinitialiser les heures pour la comparaison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const groupedConversations = () => {
    const groups = {
      'Aujourd\'hui': [],
      '7 derniers jours': [],
      'Plus ancien': []
    };

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.created_at);
      today.setHours(0, 0, 0, 0);
      convDate.setHours(0, 0, 0, 0);

      if (convDate.getTime() === today.getTime()) {
        groups['Aujourd\'hui'].push(conv);
      } else if (convDate > sevenDaysAgo) {
        groups['7 derniers jours'].push(conv);
      } else {
        groups['Plus ancien'].push(conv);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-message">Chargement de l'historique...</div>
      </div>
    );
  }

  const groups = groupedConversations();
  const hasActiveFilters = searchTerm || dateFilter !== 'all' || agentFilter !== 'all';

  return (
    <div className="history-page">
      <div className="history-header">
        <div className="header-content">
          <h1>📖 Historique</h1>
          <p>Vos conversations précédentes</p>
        </div>
      </div>

      <div className="history-container">
        {/* Barre de recherche améliorée */}
        <div className="search-bar-container">
          <div className="search-wrapper">
            <div className="search-input-wrapper">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher par titre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="clear-btn" 
                  onClick={() => setSearchTerm('')}
                >
                  <XMarkIcon className="clear-icon" />
                </button>
              )}
            </div>
            
            <button 
              className={`filter-btn ${hasActiveFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Filtres avancés"
            >
              <FunnelIcon className="filter-icon" />
              {hasActiveFilters && <span className="filter-badge">●</span>}
            </button>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-header">
                <h3>Filtres avancés</h3>
                <button className="close-filters" onClick={() => setShowFilters(false)}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="filters-grid">
                {/* Filtre par date */}
                <div className="filter-group">
                  <label>Période</label>
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Toutes les périodes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">7 derniers jours</option>
                    <option value="month">30 derniers jours</option>
                  </select>
                </div>

                {/* Filtre par agent */}
                <div className="filter-group">
                  <label>Agent</label>
                  <select 
                    value={agentFilter} 
                    onChange={(e) => setAgentFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tous les agents</option>
                    {getUniqueAgents().map(agent => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          {/* Résumé des filtres actifs */}
          {hasActiveFilters && (
            <div className="active-filters-summary">
              {searchTerm && <span className="filter-tag">🔍 {searchTerm}</span>}
              {dateFilter !== 'all' && (
                <span className="filter-tag">
                  📅 {dateFilter === 'today' ? 'Aujourd\'hui' : dateFilter === 'week' ? '7 jours' : '30 jours'}
                </span>
              )}
              {agentFilter !== 'all' && <span className="filter-tag">🤖 {agentFilter}</span>}
            </div>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {conversations.length === 0 && !loading && (
          <div className="no-conversations-warning">
            <p>Aucune conversation n'a été trouvée.</p>
            <button className="reload-btn" onClick={loadConversations}>
              ↻ Recharger
            </button>
            <p className="debug-hint">Si le problème persiste, vérifiez la console du navigateur (F12).</p>
          </div>
        )}

        {/* Résultats */}
        <div className="history-content">
          {filteredConversations.length === 0 ? (
            <div className="empty-history">
              <ClockIcon className="empty-icon" />
              <p className="empty-message">
                {hasActiveFilters 
                  ? 'Aucune conversation ne correspond à vos filtres' 
                  : 'Aucune conversation trouvée'}
              </p>
              {hasActiveFilters && (
                <button className="reset-link" onClick={resetFilters}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="conversations-groups">
              <div className="results-info">
                {filteredConversations.length} conversation{filteredConversations.length > 1 ? 's' : ''} trouvée{filteredConversations.length > 1 ? 's' : ''}
              </div>
              {Object.entries(groups).map(([groupName, convs]) => 
                convs.length > 0 && (
                  <div key={groupName} className="conversation-group">
                    <div className="group-title">{groupName}</div>
                    <div className="conversations-list">
                      {convs.map(conversation => (
                        <div
                          key={conversation.id}
                          className="conversation-item"
                          onClick={() => handleSelectConversation(conversation.id)}
                        >
                          <div className="conv-main">
                            <div className="conv-title">{conversation.title}</div>
                            <div className="conv-agent">
                              {conversation.agent_id || 'AGENT_EXPERT_ANALYTICS'}
                            </div>
                          </div>
                          <div className="conv-meta">
                            <div className="conv-date">{formatDate(conversation.created_at)}</div>
                            <button
                              className="delete-btn"
                              onClick={(e) => handleDeleteConversation(e, conversation.id)}
                              title="Supprimer"
                            >
                              <TrashIcon className="delete-icon" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;
