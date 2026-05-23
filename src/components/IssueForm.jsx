import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createIssue, fetchLabels, fetchCollaborators } from '../api/github';
import { useApp } from '../AppContext';
import { isRepoAllowed } from '../envConfig';

function LabelBadge({ label }) {
  const hex = label.color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
  return (
    <span className="label-badge" style={{ backgroundColor: `#${hex}`, color: textColor }}>
      {label.name}
    </span>
  );
}

export default function IssueForm() {
  const navigate = useNavigate();
  const { config, showToast } = useApp();

  const [form, setForm] = useState({ title: '', body: '' });
  const [labels, setLabels] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLabels(config.owner, config.repo).then(setLabels).catch(() => {});
    fetchCollaborators(config.owner, config.repo).then(setCollaborators).catch(() => {});
  }, []);

  const toggleLabel = (name) => {
    setSelectedLabels(prev =>
      prev.includes(name) ? prev.filter(l => l !== name) : [...prev, name]
    );
  };

  const toggleAssignee = (login) => {
    setSelectedAssignees(prev =>
      prev.includes(login) ? prev.filter(a => a !== login) : [...prev, login]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!isRepoAllowed(config.repoFullName)) {
      showToast('Issue creation blocked: selected repository is not allowed.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const issue = await createIssue(config.owner, config.repo, {
        title: form.title,
        body: form.body,
        labels: selectedLabels,
        assignees: selectedAssignees,
      });
      showToast(`Issue #${issue.number} created`);
      navigate(`/issue/${issue.number}`);
    } catch (err) {
      showToast('Failed to create issue: ' + err.message, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-header">
        <h1>New Issue</h1>
        <p className="form-repo">{config.repoFullName}</p>
      </div>

      <form onSubmit={handleSubmit} className="issue-form-layout">
        <div className="issue-form-main">
          <div className="field-group">
            <input
              type="text"
              className="title-input"
              placeholder="Issue title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="body-editor">
            <div className="editor-tabs">
              <button
                type="button"
                className={`editor-tab ${!preview ? 'active' : ''}`}
                onClick={() => setPreview(false)}
              >Write</button>
              <button
                type="button"
                className={`editor-tab ${preview ? 'active' : ''}`}
                onClick={() => setPreview(true)}
                disabled={!form.body}
              >Preview</button>
            </div>

            {preview ? (
              <div className="markdown-body editor-preview">
                {form.body
                  ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.body}</ReactMarkdown>
                  : <em className="no-content">Nothing to preview</em>
                }
              </div>
            ) : (
              <textarea
                className="body-textarea"
                placeholder="Leave a comment… (Markdown supported)"
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={14}
              />
            )}
            <div className="editor-footer">
              <span className="markdown-hint">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M14.85 3H1.15C.52 3 0 3.52 0 4.15v7.69C0 12.48.52 13 1.15 13h13.69c.64 0 1.15-.52 1.15-1.15v-7.7C16 3.52 15.48 3 14.85 3zM9 11H7V8L5.5 9.92 4 8v3H2V5h2l1.5 2L7 5h2v6zm2.99.5L9.5 8H11V5h2v3h1.5l-2.51 3.5z"/>
                </svg>
                Markdown supported
              </span>
            </div>
          </div>

          <div className="form-submit-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!form.title.trim() || submitting}
            >
              {submitting ? (
                <><span className="spinner" /> Creating…</>
              ) : 'Submit new issue'}
            </button>
          </div>
        </div>

        <aside className="issue-form-sidebar">
          {labels.length > 0 && (
            <div className="sidebar-section">
              <h3>Labels</h3>
              <div className="label-picker">
                {labels.map(label => {
                  const selected = selectedLabels.includes(label.name);
                  return (
                    <label key={label.id} className={`label-option ${selected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleLabel(label.name)}
                      />
                      <LabelBadge label={label} />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {collaborators.length > 0 && (
            <div className="sidebar-section">
              <h3>Assignees</h3>
              <div className="assignee-picker">
                {collaborators.map(user => {
                  const selected = selectedAssignees.includes(user.login);
                  return (
                    <label key={user.id} className={`assignee-option ${selected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleAssignee(user.login)}
                      />
                      <img src={user.avatar_url} alt={user.login} className="avatar-sm" />
                      <span>{user.login}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}
