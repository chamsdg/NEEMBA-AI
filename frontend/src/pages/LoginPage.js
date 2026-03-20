import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css';

const API_BASE_URL = 'http://localhost:8000';

function LoginPage({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      onLogin(response.data.access_token, {
        email: formData.email,
        username: formData.email.split('@')[0],
        full_name: formData.email.split('@')[0]  // Par défaut, utiliser la partie avant @
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name,
        password: formData.password
      });

      // Auto-login après inscription
      onLogin(response.data.access_token || '', {
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🤖 Neemba AI Platform</h1>
          <p>Analyse avancée avec agents Cortex</p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            Connexion
          </button>
          <button
            className={`tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >
            Inscription
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label>Nom complet</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Nom d'utilisateur</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>Démonstration: AGENT_EXPERT_ANALYTICS Snowflake Cortex</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
