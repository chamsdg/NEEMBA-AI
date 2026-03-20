import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import './SettingsPage.css';

function SettingsPage() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Paramètres</h1>
        
        <div className="settings-section">
          <h2>Apparence</h2>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Mode sombre</h3>
              <p>Basculer entre le mode clair et le mode sombre</p>
            </div>
            <div className="setting-control">
              <button 
                className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
                onClick={toggleTheme}
                title={isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
              >
                {isDarkMode ? (
                  <SunIcon className="theme-icon" />
                ) : (
                  <MoonIcon className="theme-icon" />
                )}
                <span className="toggle-label">
                  {isDarkMode ? 'Mode sombre' : 'Mode clair'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Général</h2>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Langue</h3>
              <p>Sélectionner la langue de l'interface</p>
            </div>
            <select className="setting-select" defaultValue="fr">
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Agent par défaut</h3>
              <p>Choisir l'agent utilisé par défaut</p>
            </div>
            <select className="setting-select" defaultValue="AGENT_EXPERT_ANALYTICS">
              <option value="AGENT_EXPERT_ANALYTICS">Expert Analytics</option>
              <option value="AGENT_GENERAL">Agent Général</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2>Confidentialité</h2>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Historique des conversations</h3>
              <p>Garder l'historique des conversations</p>
            </div>
            <label className="toggle-checkbox">
              <input type="checkbox" defaultChecked />
              <span></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
