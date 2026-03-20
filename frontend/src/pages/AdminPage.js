import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  UserGroupIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import './AdminPage.css';

const API_BASE_URL = 'http://localhost:8000';

function AdminPage({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalConversations: 0,
    totalAgents: 0,
    systemLoad: 65
  });
  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [roles, setRoles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      // Charger les utilisateurs (simulé)
      const mockUsers = [
        { id: 1, name: 'Aïdara Diallo', email: 'aidara@neemba.ai', role: 'admin', status: 'active', joinDate: '2024-01-15', conversations: 42 },
        { id: 2, name: 'Marie Dupont', email: 'marie@example.com', role: 'user', status: 'active', joinDate: '2024-02-01', conversations: 18 },
        { id: 3, name: 'Jean Martin', email: 'jean@example.com', role: 'user', status: 'active', joinDate: '2024-02-10', conversations: 25 },
        { id: 4, name: 'Sophie Bernard', email: 'sophie@example.com', role: 'user', status: 'inactive', joinDate: '2024-01-20', conversations: 5 },
        { id: 5, name: 'Luc Moreau', email: 'luc@example.com', role: 'user', status: 'active', joinDate: '2024-03-05', conversations: 12 },
      ];
      setUsers(mockUsers);

      // Charger les agents système
      const mockAgents = [
        { id: 'AGENT_EXPERT_ANALYTICS', name: 'Expert Analytics', status: 'active', usageCount: 234, lastUsed: '2024-03-10' },
        { id: 'AGENT_DATA_SCIENCE', name: 'Data Scientist', status: 'active', usageCount: 187, lastUsed: '2024-03-10' },
        { id: 'AGENT_CREATIVE', name: 'Creative Assistant', status: 'active', usageCount: 156, lastUsed: '2024-03-09' },
        { id: 'AGENT_CODE', name: 'Code Companion', status: 'active', usageCount: 203, lastUsed: '2024-03-10' },
      ];
      setAgents(mockAgents);

      // Charger les rôles
      const mockRoles = [
        { id: 1, name: 'Admin', permissions: ['users.view', 'users.edit', 'users.delete', 'agents.manage', 'system.config'], userCount: 1 },
        { id: 2, name: 'User', permissions: ['chats.create', 'agents.use', 'profile.edit'], userCount: 4 },
        { id: 3, name: 'Moderator', permissions: ['content.review', 'users.view', 'agents.disable'], userCount: 0 },
      ];
      setRoles(mockRoles);

      // Charger les sessions actives
      const mockSessions = [
        { id: 1, userName: 'Aïdara Diallo', email: 'aidara@neemba.ai', device: 'Chrome - Windows 10', ip: '192.168.1.100', loginTime: '09:15', lastActivity: '10:42' },
        { id: 2, userName: 'Marie Dupont', email: 'marie@example.com', device: 'Safari - macOS', ip: '192.168.1.101', loginTime: '09:45', lastActivity: '10:35' },
        { id: 3, userName: 'Jean Martin', email: 'jean@example.com', device: 'Chrome - Ubuntu', ip: '192.168.1.102', loginTime: '08:30', lastActivity: '10:40' },
      ];
      setSessions(mockSessions);

      // Calculer statistiques
      setStats({
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.status === 'active').length,
        totalConversations: mockUsers.reduce((sum, u) => sum + u.conversations, 0),
        totalAgents: mockAgents.length,
        systemLoad: 65
      });
    } catch (error) {
      console.error('Erreur chargement admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    if (action === 'delete') {
      if (!window.confirm('Supprimer cet utilisateur ?')) return;
      setUsers(prev => prev.filter(u => u.id !== userId));
    } else if (action === 'toggle') {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      ));
    }
  };

  const handleAgentAction = async (agentId, action) => {
    if (action === 'disable') {
      setAgents(prev => prev.map(a =>
        a.id === agentId ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
      ));
    }
  };

  const getFilteredUsers = () => {
    if (filter === 'active') return users.filter(u => u.status === 'active');
    if (filter === 'inactive') return users.filter(u => u.status === 'inactive');
    return users;
  };

  return (
    <div className="admin-page">
      {/* En-tête admin */}
      <div className="admin-header">
        <div className="admin-title-section">
          <ExclamationTriangleIcon className="admin-icon" />
          <h1>Panneau d'administration</h1>
        </div>
        <div className="admin-badge">Admin • Accès complet</div>
      </div>

      {/* Onglets */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Tableau de bord
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Utilisateurs ({stats.totalUsers})
        </button>
        <button
          className={`admin-tab ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          🤖 Agents ({stats.totalAgents})
        </button>
        <button
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button
          className={`admin-tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          🔐 Rôles ({roles.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          🟢 Sessions ({sessions.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Logs d'activité
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Paramètres
        </button>
      </div>

      {/* Contenu */}
      <div className="admin-content">
        {/* === TABLEAU DE BORD === */}
        {activeTab === 'dashboard' && (
          <div className="admin-section">
            <h2>Vue d'ensemble du système</h2>

            {/* Cartes de statistiques */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-label">Utilisateurs totaux</div>
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-detail">{stats.activeUsers} actifs</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon conversations-icon">💬</div>
                <div className="stat-info">
                  <div className="stat-label">Conversations totales</div>
                  <div className="stat-value">{stats.totalConversations}</div>
                  <div className="stat-detail">+12 depuis hier</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon agents-icon">🤖</div>
                <div className="stat-info">
                  <div className="stat-label">Agents actifs</div>
                  <div className="stat-value">{stats.totalAgents}</div>
                  <div className="stat-detail">Tous fonctionnels</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon system-icon">⚡</div>
                <div className="stat-info">
                  <div className="stat-label">Charge système</div>
                  <div className="stat-value">{stats.systemLoad}%</div>
                  <div className="stat-detail">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${stats.systemLoad}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alertes systèmes */}
            <div className="system-alerts">
              <h3>⚠️ Alertes systèmes</h3>
              <div className="alert-list">
                <div className="alert alert-info">
                  <span>✓ Tous les agents fonctionnent correctement</span>
                </div>
                <div className="alert alert-success">
                  <span>✓ Serveur API en excellente condition</span>
                </div>
                <div className="alert alert-warning">
                  <span>⚠ Base de données à 78% de capacité</span>
                </div>
              </div>
            </div>

            {/* Top utilisateurs */}
            <div className="top-section">
              <h3>🏆 Top utilisateurs actifs</h3>
              <div className="top-list">
                {users.sort((a, b) => b.conversations - a.conversations).slice(0, 3).map((u, idx) => (
                  <div key={u.id} className="top-item">
                    <span className="top-rank">#{idx + 1}</span>
                    <span className="top-name">{u.name}</span>
                    <span className="top-metric">{u.conversations} conversations</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === GESTION DES UTILISATEURS === */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Gestion des utilisateurs</h2>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Tous ({users.length})
                </button>
                <button 
                  className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  Actifs ({users.filter(u => u.status === 'active').length})
                </button>
                <button 
                  className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
                  onClick={() => setFilter('inactive')}
                >
                  Inactifs ({users.filter(u => u.status === 'inactive').length})
                </button>
              </div>
            </div>

            <div className="users-table">
              <div className="table-header">
                <div className="col col-name">Utilisateur</div>
                <div className="col col-email">Email</div>
                <div className="col col-role">Rôle</div>
                <div className="col col-status">Statut</div>
                <div className="col col-conv">Conversations</div>
                <div className="col col-actions">Actions</div>
              </div>

              {getFilteredUsers().map(u => (
                <div key={u.id} className="table-row">
                  <div className="col col-name">
                    <div className="user-avatar">{u.name[0]}</div>
                    {u.name}
                  </div>
                  <div className="col col-email">{u.email}</div>
                  <div className="col col-role">
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </div>
                  <div className="col col-status">
                    <span className={`status-badge ${u.status}`}>
                      {u.status === 'active' ? '✓ Actif' : '✗ Inactif'}
                    </span>
                  </div>
                  <div className="col col-conv">{u.conversations}</div>
                  <div className="col col-actions">
                    <button
                      className="action-btn toggle-btn"
                      onClick={() => handleUserAction(u.id, 'toggle')}
                      title="Activer/Désactiver"
                    >
                      {u.status === 'active' ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleUserAction(u.id, 'delete')}
                      title="Supprimer"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === GESTION DES AGENTS === */}
        {activeTab === 'agents' && (
          <div className="admin-section">
            <h2>Gestion des agents IA</h2>

            <div className="agents-grid">
              {agents.map(agent => (
                <div key={agent.id} className="agent-admin-card">
                  <div className="agent-admin-header">
                    <h3>🤖 {agent.name}</h3>
                    <span className={`status-badge ${agent.status}`}>
                      {agent.status === 'active' ? '✓ Actif' : '✗ Inactif'}
                    </span>
                  </div>

                  <div className="agent-admin-info">
                    <div className="info-row">
                      <span className="label">ID Agent:</span>
                      <span className="value">{agent.id}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Utilisations:</span>
                      <span className="value">{agent.usageCount}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Dernière utilisation:</span>
                      <span className="value">{agent.lastUsed}</span>
                    </div>
                  </div>

                  <div className="agent-admin-actions">
                    <button
                      className={`action-btn ${agent.status === 'active' ? 'disable-btn' : 'enable-btn'}`}
                      onClick={() => handleAgentAction(agent.id, 'disable')}
                    >
                      {agent.status === 'active' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button className="action-btn edit-btn">Éditer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === ANALYTICS & RAPPORTS === */}
        {activeTab === 'analytics' && (
          <div className="admin-section">
            <h2>📈 Analytics & Rapports</h2>

            {/* Graphiques principaux */}
            <div className="analytics-grid">
              <div className="chart-card">
                <h3>📊 Croissance des utilisateurs</h3>
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    <div className="bar" style={{ height: '40%' }}>Janvier</div>
                    <div className="bar" style={{ height: '55%' }}>Février</div>
                    <div className="bar" style={{ height: '75%' }}>Mars</div>
                  </div>
                </div>
                <div className="chart-info">+87% croissance</div>
              </div>

              <div className="chart-card">
                <h3>💬 Sessions conversations</h3>
                <div className="chart-placeholder">
                  <div className="chart-line">━━━━━━━━</div>
                </div>
                <div className="chart-info">Moyenne: 12.4 par jour</div>
              </div>

              <div className="chart-card">
                <h3>🤖 Utilisation par agent</h3>
                <div className="agent-usage-list">
                  <div className="usage-item">
                    <span className="usage-name">Analytics</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '95%' }}></div>
                    </div>
                    <span className="usage-count">234</span>
                  </div>
                  <div className="usage-item">
                    <span className="usage-name">Code</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '82%' }}></div>
                    </div>
                    <span className="usage-count">203</span>
                  </div>
                  <div className="usage-item">
                    <span className="usage-name">Data Sci</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '76%' }}></div>
                    </div>
                    <span className="usage-count">187</span>
                  </div>
                  <div className="usage-item">
                    <span className="usage-name">Creative</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: '63%' }}></div>
                    </div>
                    <span className="usage-count">156</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques détaillées */}
            <div className="stats-detailed">
              <h3>📋 Statistiques détaillées</h3>
              <div className="detailed-stats-grid">
                <div className="stat-detail-card">
                  <div className="stat-d-label">Messages totaux</div>
                  <div className="stat-d-value">2,847</div>
                  <div className="stat-d-trend">↑ +34 depuis hier</div>
                </div>
                <div className="stat-detail-card">
                  <div className="stat-d-label">Temps moyen conversation</div>
                  <div className="stat-d-value">8.2 min</div>
                  <div className="stat-d-trend">↓ -0.5 min</div>
                </div>
                <div className="stat-detail-card">
                  <div className="stat-d-label">Taux satisfaction</div>
                  <div className="stat-d-value">94%</div>
                  <div className="stat-d-trend">↑ +2%</div>
                </div>
                <div className="stat-detail-card">
                  <div className="stat-d-label">Taux abandons</div>
                  <div className="stat-d-value">6%</div>
                  <div className="stat-d-trend">↓ -1%</div>
                </div>
              </div>
            </div>

            {/* Boutons d'export */}
            <div className="export-buttons">
              <button className="btn btn-primary">📥 Télécharger rapport PDF</button>
              <button className="btn btn-secondary">📊 Exporter données CSV</button>
            </div>
          </div>
        )}

        {/* === GESTION DES RÔLES === */}
        {activeTab === 'roles' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>🔐 Gestion des rôles et permissions</h2>
              <button className="btn btn-primary">➕ Créer un rôle</button>
            </div>

            <div className="roles-grid">
              {roles.map(role => (
                <div key={role.id} className="role-card">
                  <div className="role-header">
                    <h3>{role.name}</h3>
                    <span className="user-count">{role.userCount} {role.userCount === 1 ? 'utilisateur' : 'utilisateurs'}</span>
                  </div>

                  <div className="permissions-list">
                    <h4>Permissions</h4>
                    {role.permissions.map((perm, idx) => (
                      <div key={idx} className="permission-item">
                        <input type="checkbox" defaultChecked id={`${role.id}-${idx}`} />
                        <label htmlFor={`${role.id}-${idx}`}>{perm}</label>
                      </div>
                    ))}
                  </div>

                  <div className="role-actions">
                    <button className="btn btn-secondary">✏️ Éditer</button>
                    {role.id !== 1 && <button className="btn btn-danger">🗑️ Supprimer</button>}
                  </div>
                </div>
              ))}
            </div>

            {/* Permissions disponibles */}
            <div className="all-permissions">
              <h3>📋 Toutes les permissions disponibles</h3>
              <div className="permissions-reference">
                <div className="perm-category">
                  <h4>👥 Utilisateurs</h4>
                  <ul>
                    <li>users.view - Voir les utilisateurs</li>
                    <li>users.edit - Éditer les utilisateurs</li>
                    <li>users.delete - Supprimer les utilisateurs</li>
                    <li>users.export - Exporter les données</li>
                  </ul>
                </div>
                <div className="perm-category">
                  <h4>🤖 Agents</h4>
                  <ul>
                    <li>agents.manage - Gérer les agents</li>
                    <li>agents.create - Créer des agents</li>
                    <li>agents.disable - Désactiver des agents</li>
                  </ul>
                </div>
                <div className="perm-category">
                  <h4>⚙️ Système</h4>
                  <ul>
                    <li>system.config - Configurer le système</li>
                    <li>system.logs - Voir les logs</li>
                    <li>system.backup - Gérer sauvegardes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === SESSIONS ACTIVES === */}
        {activeTab === 'sessions' && (
          <div className="admin-section">
            <h2>🟢 Sessions utilisateur actives</h2>
            <p className="section-subtitle">Utilisateurs connectés en ce moment ({sessions.length})</p>

            <div className="sessions-table">
              <div className="table-header">
                <div className="col col-user">Utilisateur</div>
                <div className="col col-device">Appareil</div>
                <div className="col col-ip">Adresse IP</div>
                <div className="col col-login">Connexion</div>
                <div className="col col-activity">Dernière activité</div>
                <div className="col col-actions">Actions</div>
              </div>

              {sessions.map(session => (
                <div key={session.id} className="table-row session-row">
                  <div className="col col-user">
                    <div className="session-user">
                      <div className="online-badge"></div>
                      <div>
                        <div className="user-name">{session.userName}</div>
                        <div className="user-email">{session.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col col-device">{session.device}</div>
                  <div className="col col-ip">{session.ip}</div>
                  <div className="col col-login">{session.loginTime}</div>
                  <div className="col col-activity">{session.lastActivity}</div>
                  <div className="col col-actions">
                    <button 
                      className="action-btn session-action-btn"
                      title="Forcer la déconnexion"
                    >
                      🔓 Déconnecter
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Infos de sécurité */}
            <div className="security-info">
              <h3>🔒 Informations de sécurité</h3>
              <div className="security-items">
                <div className="security-item">
                  <span className="icon">✓</span>
                  <span>Tous les appareils utilisent HTTPS</span>
                </div>
                <div className="security-item">
                  <span className="icon">✓</span>
                  <span>Les sessions inactives expirent après 30 minutes</span>
                </div>
                <div className="security-item">
                  <span className="icon">⚠</span>
                  <span>1 connexion depuis nouvel IP détectée aujourd'hui</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === LOGS D'ACTIVITÉ === */}
        {activeTab === 'logs' && (
          <div className="admin-section">
            <h2>Historique des activités</h2>

            <div className="logs-list">
              <div className="log-entry">
                <div className="log-time">10:45</div>
                <div className="log-content">
                  <div className="log-title">👤 Marie Dupont</div>
                  <div className="log-description">A créé une nouvelle conversation</div>
                </div>
                <div className="log-type">conversation</div>
              </div>

              <div className="log-entry">
                <div className="log-time">10:32</div>
                <div className="log-content">
                  <div className="log-title">🤖 Data Scientist</div>
                  <div className="log-description">Agent chargé 23 fois par Jean Martin</div>
                </div>
                <div className="log-type">agent</div>
              </div>

              <div className="log-entry">
                <div className="log-time">10:15</div>
                <div className="log-content">
                  <div className="log-title">👤 Sophie Bernard</div>
                  <div className="log-description">Connexion à la plateforme</div>
                </div>
                <div className="log-type">login</div>
              </div>

              <div className="log-entry">
                <div className="log-time">09:50</div>
                <div className="log-content">
                  <div className="log-title">⚙️ Système</div>
                  <div className="log-description">Maintenance planifiée effectuée</div>
                </div>
                <div className="log-type">system</div>
              </div>

              <div className="log-entry">
                <div className="log-time">09:20</div>
                <div className="log-content">
                  <div className="log-title">👤 Luc Moreau</div>
                  <div className="log-description">A créé un nouvel agent personnalisé</div>
                </div>
                <div className="log-type">agent</div>
              </div>
            </div>
          </div>
        )}

        {/* === PARAMÈTRES SYSTÈME === */}
        {activeTab === 'settings' && (
          <div className="admin-section">
            <h2>⚙️ Paramètres système</h2>

            <div className="settings-groups">
              {/* Paramètres généraux */}
              <div className="settings-group">
                <h3>Paramètres généraux</h3>
                <div className="setting-item">
                  <label>Nom de la plateforme</label>
                  <input type="text" defaultValue="Neemba AI" />
                </div>
                <div className="setting-item">
                  <label>Email de support</label>
                  <input type="email" defaultValue="support@neemba.ai" />
                </div>
                <div className="setting-item">
                  <label>URL de base</label>
                  <input type="text" defaultValue="http://localhost:3000" />
                </div>
              </div>

              {/* Paramètres API */}
              <div className="settings-group">
                <h3>Configuration API</h3>
                <div className="setting-item">
                  <label>URL API backend</label>
                  <input type="text" defaultValue="http://localhost:8000" />
                </div>
                <div className="setting-item">
                  <label>Timeout API (secondes)</label>
                  <input type="number" defaultValue="30" />
                </div>
                <div className="setting-item checkbox">
                  <input type="checkbox" defaultChecked />
                  <label>Activer cache API</label>
                </div>
              </div>

              {/* Paramètres sécurité */}
              <div className="settings-group">
                <h3>Sécurité</h3>
                <div className="setting-item checkbox">
                  <input type="checkbox" defaultChecked />
                  <label>Authentification 2FA obligatoire</label>
                </div>
                <div className="setting-item checkbox">
                  <input type="checkbox" defaultChecked />
                  <label>Enregistrer les activités utilisateur</label>
                </div>
                <div className="setting-item checkbox">
                  <input type="checkbox" />
                  <label>Mode maintenance</label>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="settings-actions">
                <button className="btn btn-primary">💾 Sauvegarder</button>
                <button className="btn btn-secondary">↺ Réinitialiser valeurs par défaut</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
