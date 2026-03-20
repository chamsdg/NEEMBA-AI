import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from './hooks/useTheme';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import AgentsPage from './pages/AgentsPage';
import CustomAgentPage from './pages/CustomAgentPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import LayoutMain from './components/LayoutMain';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si user est connecté (token en localStorage)
    const token = localStorage.getItem('access_token');
    if (token) {
      // Vérifier que le token est valide
      checkAuth(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      // On pourrait faire un appel API pour vérifier le token
      // Pour maintenant, on suppose qu'un token = utilisateur connecté
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/dashboard" element={
          isAuthenticated ? (
            <LayoutMain user={user} onLogout={handleLogout}>
              <DashboardPage user={user} />
            </LayoutMain>
          ) : <Navigate to="/login" />
        } />
        <Route path="/chat" element={
          isAuthenticated ? (
            <LayoutMain user={user} onLogout={handleLogout}>
              <ChatPage user={user} />
            </LayoutMain>
          ) : <Navigate to="/login" />
        } />
        <Route path="/history" element={
          isAuthenticated ? (
            <LayoutMain user={user} onLogout={handleLogout}>
              <HistoryPage user={user} />
            </LayoutMain>
          ) : <Navigate to="/login" />
        } />
        <Route path="/agents" element={
          isAuthenticated ? (
            <LayoutMain user={user} onLogout={handleLogout}>
              <AgentsPage />
            </LayoutMain>
          ) : <Navigate to="/login" />
        } />
        <Route path="/automation" element={
          isAuthenticated ? (
            <LayoutMain user={user} onLogout={handleLogout}>
              <CustomAgentPage />
            </LayoutMain>
          ) : <Navigate to="/login" />
        } />
        <Route path="/my-agents" element={
          isAuthenticated ? (
            <LayoutMain user={user} onLogout={handleLogout}>
              <CustomAgentPage />
            </LayoutMain>
          ) : <Navigate to="/login" />
        } />
        <Route path="/settings" element={
          isAuthenticated ? (
            <LayoutMain user={user} onLogout={handleLogout}>
              <SettingsPage />
            </LayoutMain>
          ) : <Navigate to="/login" />
        } />
        <Route path="/admin" element={
          isAuthenticated ? (
            <LayoutMain user={user} onLogout={handleLogout}>
              <AdminPage user={user} />
            </LayoutMain>
          ) : <Navigate to="/login" />
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
