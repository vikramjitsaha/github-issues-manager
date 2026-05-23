import { createContext, useContext, useState, useEffect } from 'react';
import { initOctokit } from './api/github';
import { isRepoAllowed } from './envConfig';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('gh_issues_config');
      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);
      return isRepoAllowed(parsed.repoFullName) ? parsed : null;
    } catch {
      return null;
    }
  });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (config?.token) {
      initOctokit(config.token, config.baseUrl);
    }
  }, [config]);

  const saveConfig = (newConfig) => {
    if (!isRepoAllowed(newConfig.repoFullName)) {
      throw new Error('Selected repository is not in VITE_GITHUB_ALLOWED_REPOS');
    }

    const normalizedConfig = {
      ...newConfig,
      baseUrl: newConfig.baseUrl || import.meta.env.VITE_GITHUB_BASE_URL?.trim() || 'https://api.github.com',
    };

    localStorage.setItem('gh_issues_config', JSON.stringify(normalizedConfig));
    setConfig(normalizedConfig);
    initOctokit(normalizedConfig.token, normalizedConfig.baseUrl);
  };

  const clearConfig = () => {
    localStorage.removeItem('gh_issues_config');
    setConfig(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <AppContext.Provider value={{ config, saveConfig, clearConfig, toast, showToast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
