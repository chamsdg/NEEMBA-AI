import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Vérifier localStorage en premier
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    
    // Sinon, vérifier la préférence système
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Sauvegarder la préférence
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Appliquer le thème au document
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return { isDarkMode, toggleTheme };
};
