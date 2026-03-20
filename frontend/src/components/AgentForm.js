import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import './AgentForm.css';

function AgentForm({ agent, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🤖',
    description: '',
    prompt: '',
    temperature: '0.7',
    max_tokens: '2000',
    features: [],
    color: 'blue'
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (agent) {
      setFormData(agent);
    }
  }, [agent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Le nom de l\'agent est requis');
      return;
    }
    if (!formData.prompt.trim()) {
      alert('Le prompt est requis');
      return;
    }
    onSubmit(formData);
  };

  const temperatureExplanations = {
    '0.0': 'Déterministe - Réponses cohérentes',
    '0.5': 'Équilibré - Créativité modérée',
    '0.7': 'Recommandé - Bon équilibre',
    '1.0': 'Créatif - Plus de variation',
    '1.5': 'Très créatif - Plus d\'imprévisibilité'
  };

  return (
    <div className="agent-form-container">
      <h2>{agent ? 'Modifier l\'agent' : 'Créer un nouvel agent'}</h2>
      
      <form className="agent-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group emoji-group">
            <label>Emoji de l'agent</label>
            <input
              type="text"
              name="emoji"
              value={formData.emoji}
              onChange={handleChange}
              placeholder="🤖"
              maxLength="2"
            />
            <small>Tapez un unique emoji</small>
          </div>

          <div className="form-group">
            <label>Nom de l'agent *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Assistant Analytics"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ex: Spécialiste en analyse de données..."
            required
          />
        </div>

        <div className="form-group">
          <label>Prompt système *</label>
          <textarea
            name="prompt"
            value={formData.prompt}
            onChange={handleChange}
            placeholder="Définissez le comportement de l'agent... Ex: Tu es un expert en analyse de données..."
            rows="6"
            required
          />
          <small className="hint">
            Le prompt définit comment l'agent se comportera et comment il répondra
          </small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Température ⚙️</label>
            <input
              type="range"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              min="0"
              max="2"
              step="0.1"
            />
            <div className="temperature-info">
              <span className="temp-value">{formData.temperature}</span>
              <span className="temp-explanation">
                {temperatureExplanations[formData.temperature] || 'Niveau de créativité'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Max tokens</label>
            <input
              type="number"
              name="max_tokens"
              value={formData.max_tokens}
              onChange={handleChange}
              placeholder="2000"
              min="100"
            />
            <small>Taille maximale de la réponse</small>
          </div>

          <div className="form-group">
            <label>Couleur</label>
            <select name="color" value={formData.color} onChange={handleChange}>
              <option value="blue">Bleu</option>
              <option value="purple">Violet</option>
              <option value="pink">Rose</option>
              <option value="green">Vert</option>
              <option value="orange">Orange</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Fonctionnalités</label>
          <div className="features-input">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Ex: Analyse de données"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
            />
            <button
              type="button"
              className="add-feature-btn"
              onClick={handleAddFeature}
            >
              Ajouter
            </button>
          </div>

          {formData.features && formData.features.length > 0 && (
            <div className="features-list">
              {formData.features.map((feature, index) => (
                <div key={index} className="feature-badge">
                  <span>{feature}</span>
                  <button
                    type="button"
                    className="remove-feature"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <XMarkIcon className="icon" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="submit-btn"
          >
            {agent ? 'Modifier l\'agent' : 'Créer l\'agent'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AgentForm;
