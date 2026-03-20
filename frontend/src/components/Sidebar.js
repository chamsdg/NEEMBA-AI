import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, ChatBubbleLeftIcon, ClockIcon, SparklesIcon, CogIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import './Sidebar.css';

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: HomeIcon, label: 'Accueil', path: '/dashboard' },
    { icon: ChatBubbleLeftIcon, label: 'Nouveau Chat', path: '/chat' },
    { icon: ClockIcon, label: 'Historique', path: '/history' },
    { icon: SparklesIcon, label: 'Agents IA', path: '/agents' },
    { icon: SparklesIcon, label: 'Mes agents', path: '/my-agents' },
    { icon: CogIcon, label: 'IA Automation', path: null, disabled: true },
  ];

  const adminItems = [
    { 
      icon: ShieldCheckIcon, 
      label: 'Admin', 
      path: '/admin' 
    },
    { 
      icon: CogIcon, 
      label: 'Paramètres', 
      path: '/settings' 
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-badge">🤖</div>
        <h1>Neemba AI</h1>
      </div>

      {/* Navigation principale */}
      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className={`nav-item ${isActive(item.path) ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Séparateur */}
      <div className="sidebar-divider"></div>

      {/* Admin */}
      <nav className="sidebar-nav sidebar-admin">
        {adminItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <button className="nav-item logout" onClick={onLogout}>
        <ArrowRightOnRectangleIcon className="nav-icon" />
        <span className="nav-label">Déconnexion</span>
      </button>

      {/* Profil utilisateur */}
      {user && (
        <div className="sidebar-profile">
          <div className="profile-avatar">{user.full_name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="profile-info">
            <div className="profile-name">{user.full_name || user.email}</div>
            <div className="profile-subtitle">Voir mon profil</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
