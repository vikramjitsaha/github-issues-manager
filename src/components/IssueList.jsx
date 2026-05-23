import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchIssues, fetchLabels } from '../api/github';
import { useApp } from '../AppContext';
import { formatDistanceToNow } from 'date-fns';

function LabelBadge({ label }) {
  const hex = label.color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
  return (
    <span
      className="label-badge"
      style={{ backgroundColor: `#${hex}`, color: textColor }}
    >
      {label.name}
    </span>
  );
}

export default function IssueList() {
  const { config } = useApp();
  const [issues, setIssues] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    state: 'open',
    label: '',
    sort: 'created',
    page: 1,
  });
  const [hasMore, setHasMore] = useState(true);

  const loadIssues = useCallback(async (newFilters, append = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchIssues(config.owner, config.repo, {
        state: newFilters.state,
        labels: newFilters.label || undefined,
        sort: newFilters.sort,
        per_page: 25,
        page: newFilters.page,
      });
      setHasMore(data.length === 25);
      setIssues(prev => append ? [...prev, ...data] : data);
    } catch (err) {
      setError('Failed to load issues: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadIssues(filters);
    fetchLabels(config.owner, config.repo).then(setLabels).catch(() => {});
  }, []);

  const applyFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadIssues(newFilters);
  };

  const loadMore = () => {
    const newFilters = { ...filters, page: filters.page + 1 };
    setFilters(newFilters);
    loadIssues(newFilters, true);
  };

  const openCount = issues.filter(i => i.state === 'open').length;

  return (
    <div className="issue-list-page">
      <div className="list-toolbar">
        <div className="state-tabs">
          <button
            className={`state-tab ${filters.state === 'open' ? 'active' : ''}`}
            onClick={() => applyFilter('state', 'open')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
            </svg>
            Open
          </button>
          <button
            className={`state-tab ${filters.state === 'closed' ? 'active' : ''}`}
            onClick={() => applyFilter('state', 'closed')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z"/>
              <path fillRule="evenodd" d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"/>
            </svg>
            Closed
          </button>
          <button
            className={`state-tab ${filters.state === 'all' ? 'active' : ''}`}
            onClick={() => applyFilter('state', 'all')}
          >
            All
          </button>
        </div>

        <div className="filter-controls">
          {labels.length > 0 && (
            <select
              className="filter-select"
              value={filters.label}
              onChange={e => applyFilter('label', e.target.value)}
            >
              <option value="">All Labels</option>
              {labels.map(l => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
          )}

          <select
            className="filter-select"
            value={filters.sort}
            onChange={e => applyFilter('sort', e.target.value)}
          >
            <option value="created">Newest</option>
            <option value="updated">Recently Updated</option>
            <option value="comments">Most Comments</option>
          </select>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="issues-container">
        {loading && issues.length === 0 ? (
          <div className="loading-state">
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-issue" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M9 9a3 3 0 015.12 2.12C14.12 12.84 12 13 12 15"/>
              <circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
            <p>No {filters.state !== 'all' ? filters.state : ''} issues found</p>
          </div>
        ) : (
          <>
            {issues.map((issue, idx) => (
              <Link
                key={issue.id}
                to={`/issue/${issue.number}`}
                className="issue-row"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="issue-status-icon">
                  {issue.state === 'open' ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#3fb950">
                      <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                      <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#8957e5">
                      <path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z"/>
                      <path fillRule="evenodd" d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"/>
                    </svg>
                  )}
                </div>

                <div className="issue-content">
                  <div className="issue-title-row">
                    <span className="issue-title">{issue.title}</span>
                    {issue.labels.map(label => (
                      <LabelBadge key={label.id} label={label} />
                    ))}
                  </div>
                  <div className="issue-meta">
                    <span className="issue-number">#{issue.number}</span>
                    <span>·</span>
                    <span>{issue.state === 'open' ? 'Opened' : 'Closed'} {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                    <span>· by <strong>{issue.user.login}</strong></span>
                    {issue.assignees?.length > 0 && (
                      <span>· assigned to {issue.assignees.map(a => a.login).join(', ')}</span>
                    )}
                  </div>
                </div>

                {issue.comments > 0 && (
                  <div className="issue-comments">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M2.75 2.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 01.75.75v2.19l2.72-2.72a.75.75 0 01.53-.22h4.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25H2.75zM1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0113.25 12H9.06l-2.573 2.573A1.457 1.457 0 014 13.543V12H2.75A1.75 1.75 0 011 10.25v-7.5z"/>
                    </svg>
                    {issue.comments}
                  </div>
                )}
              </Link>
            ))}

            {hasMore && (
              <button className="load-more" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : 'Load more issues'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
