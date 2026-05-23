import { useState } from 'react';
import { validateCredentials } from '../api/github';
import { useApp } from '../AppContext';
import { getAllowedRepoOptions } from '../envConfig';

export default function Setup() {
  const { saveConfig } = useApp();
  const allowedRepoOptions = getAllowedRepoOptions();
  const hasAllowedRepos = allowedRepoOptions.length > 0;
  const baseUrl = import.meta.env.VITE_GITHUB_BASE_URL?.trim() || 'https://api.github.com';
  const envToken = import.meta.env.VITE_GITHUB_TOKEN?.trim() || '';
  const defaultRepo = allowedRepoOptions[0]?.fullName || '';

  const [form, setForm] = useState({
    token: envToken,
    owner: allowedRepoOptions[0]?.owner || '',
    repo: allowedRepoOptions[0]?.repo || '',
    selectedRepo: defaultRepo,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRepoSelection = (fullName) => {
    const selected = allowedRepoOptions.find(item => item.fullName === fullName);
    if (!selected) {
      return;
    }
    setForm(f => ({
      ...f,
      selectedRepo: selected.fullName,
      owner: selected.owner,
      repo: selected.repo,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!form.token) {
        throw new Error('Missing GitHub token in VITE_GITHUB_TOKEN');
      }

      const repoData = await validateCredentials(form.token, form.owner, form.repo, baseUrl);
      saveConfig({
        token: form.token,
        owner: form.owner,
        repo: form.repo,
        repoFullName: repoData.full_name,
        repoDesc: repoData.description,
        baseUrl,
        allowedRepos: allowedRepoOptions.map(item => item.fullName),
      });
    } catch (err) {
      setError(err.status === 404
        ? 'Repository not found. Check owner/repo name.'
        : err.status === 401
        ? 'Invalid token. Check your GitHub PAT.'
        : `Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <h1>GitHub Issues</h1>
        <p className="setup-subtitle">Connect to your private repository</p>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="field-group">
            <label>Personal Access Token</label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={form.token}
              onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
              required
              autoComplete="off"
            />
            <span className="field-hint">
              Needs <code>repo</code> scope.{' '}
              <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer">
                Generate token →
              </a>
            </span>
          </div>

          {hasAllowedRepos && (
            <div className="field-group">
              <label>Allowed Repository</label>
              <select
                value={form.selectedRepo}
                onChange={e => handleRepoSelection(e.target.value)}
                required
              >
                {allowedRepoOptions.map(option => (
                  <option key={option.fullName} value={option.fullName}>
                    {option.fullName}
                  </option>
                ))}
              </select>
              <span className="field-hint">Only repositories from <code>VITE_GITHUB_ALLOWED_REPOS</code> can be used.</span>
            </div>
          )}

          <div className="field-row">
            <div className="field-group">
              <label>Owner</label>
              <input
                type="text"
                placeholder="username or org"
                value={form.owner}
                onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                required
                readOnly={hasAllowedRepos}
              />
            </div>
            <div className="field-group">
              <label>Repository</label>
              <input
                type="text"
                placeholder="repo-name"
                value={form.repo}
                onChange={e => setForm(f => ({ ...f, repo: e.target.value }))}
                required
                readOnly={hasAllowedRepos}
              />
            </div>
          </div>

          {error && <div className="setup-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <><span className="spinner" /> Connecting…</>
            ) : 'Connect Repository'}
          </button>
        </form>

        <p className="setup-note">
          Your token is stored only in localStorage — never sent anywhere except GitHub's API.
        </p>
      </div>
    </div>
  );
}
