import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchIssue, fetchIssueComments, updateIssue, addComment, fetchLabels } from '../api/github';
import { useApp } from '../AppContext';
import { formatDistanceToNow, format } from 'date-fns';

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

export default function IssueDetail() {
  const { number } = useParams();
  const navigate = useNavigate();
  const { config, showToast } = useApp();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', body: '', selectedLabels: [] });
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentPreview, setCommentPreview] = useState(false);

  useEffect(() => {
    loadIssue();
    fetchLabels(config.owner, config.repo).then(setLabels).catch(() => {});
  }, [number]);

  const loadIssue = async () => {
    setLoading(true);
    setError('');
    try {
      const [issueData, commentsData] = await Promise.all([
        fetchIssue(config.owner, config.repo, parseInt(number)),
        fetchIssueComments(config.owner, config.repo, parseInt(number)),
      ]);
      setIssue(issueData);
      setComments(commentsData);
      setEditForm({
        title: issueData.title,
        body: issueData.body || '',
        selectedLabels: issueData.labels.map(l => l.name),
      });
    } catch (err) {
      setError('Failed to load issue: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setSubmitting(true);
    try {
      const updated = await updateIssue(config.owner, config.repo, parseInt(number), {
        title: editForm.title,
        body: editForm.body,
        labels: editForm.selectedLabels,
      });
      setIssue(updated);
      setEditing(false);
      showToast('Issue updated successfully');
    } catch (err) {
      showToast('Failed to update issue: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleState = async () => {
    const newState = issue.state === 'open' ? 'closed' : 'open';
    setSubmitting(true);
    try {
      const updated = await updateIssue(config.owner, config.repo, parseInt(number), {
        title: issue.title,
        body: issue.body,
        state: newState,
      });
      setIssue(updated);
      showToast(`Issue ${newState === 'closed' ? 'closed' : 'reopened'}`);
    } catch (err) {
      showToast('Failed to update issue state', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(config.owner, config.repo, parseInt(number), commentText);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setCommentPreview(false);
      showToast('Comment added');
    } catch (err) {
      showToast('Failed to add comment: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLabel = (labelName) => {
    setEditForm(f => ({
      ...f,
      selectedLabels: f.selectedLabels.includes(labelName)
        ? f.selectedLabels.filter(l => l !== labelName)
        : [...f.selectedLabels, labelName],
    }));
  };

  if (loading) return (
    <div className="detail-page">
      <div className="loading-detail">
        <div className="skeleton-title" />
        <div className="skeleton-body" />
      </div>
    </div>
  );

  if (error) return (
    <div className="detail-page">
      <div className="error-banner">{error}</div>
      <Link to="/" className="back-link">← Back to issues</Link>
    </div>
  );

  if (!issue) return null;

  return (
    <div className="detail-page">
      <div className="detail-breadcrumb">
        <Link to="/" className="back-link">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M9.78 12.78a.75.75 0 01-1.06 0L4.47 8.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L6.06 8l3.72 3.72a.75.75 0 010 1.06z"/>
          </svg>
          All Issues
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-num">#{issue.number}</span>
      </div>

      <div className="detail-layout">
        <main className="detail-main">
          {/* Title */}
          {editing ? (
            <input
              className="edit-title-input"
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            />
          ) : (
            <h1 className="detail-title">
              {issue.title}
              <span className="detail-number"> #{issue.number}</span>
            </h1>
          )}

          {/* Status bar */}
          <div className="detail-status-bar">
            <span className={`status-pill ${issue.state}`}>
              {issue.state === 'open' ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z"/>
                  <path fillRule="evenodd" d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"/>
                </svg>
              )}
              {issue.state}
            </span>
            <span className="status-meta">
              <strong>{issue.user.login}</strong> opened {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
              {comments.length > 0 && <> · {comments.length} comment{comments.length !== 1 ? 's' : ''}</>}
            </span>

            <div className="detail-actions">
              {!editing && (
                <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
              {editing && (
                <>
                  <button className="btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn-primary btn-sm" onClick={handleSaveEdit} disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Issue body */}
          <div className="timeline">
            <div className="timeline-item">
              <img
                src={issue.user.avatar_url}
                alt={issue.user.login}
                className="avatar"
              />
              <div className="comment-box comment-box--main">
                <div className="comment-header">
                  <strong>{issue.user.login}</strong>
                  <span className="comment-time" title={format(new Date(issue.created_at), 'PPpp')}>
                    {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                  </span>
                  {issue.author_association !== 'NONE' && (
                    <span className="author-badge">{issue.author_association.toLowerCase()}</span>
                  )}
                </div>
                {editing ? (
                  <textarea
                    className="edit-body-textarea"
                    value={editForm.body}
                    onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))}
                    rows={12}
                    placeholder="Leave a description…"
                  />
                ) : (
                  <div className="markdown-body">
                    {issue.body ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.body}</ReactMarkdown>
                    ) : (
                      <em className="no-content">No description provided.</em>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            {comments.map(comment => (
              <div key={comment.id} className="timeline-item">
                <img src={comment.user.avatar_url} alt={comment.user.login} className="avatar" />
                <div className="comment-box">
                  <div className="comment-header">
                    <strong>{comment.user.login}</strong>
                    <span className="comment-time" title={format(new Date(comment.created_at), 'PPpp')}>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <div className="timeline-item add-comment">
              <div className="add-comment-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div className="comment-box new-comment-box">
                <div className="comment-tabs">
                  <button
                    className={`comment-tab ${!commentPreview ? 'active' : ''}`}
                    onClick={() => setCommentPreview(false)}
                  >Write</button>
                  <button
                    className={`comment-tab ${commentPreview ? 'active' : ''}`}
                    onClick={() => setCommentPreview(true)}
                    disabled={!commentText}
                  >Preview</button>
                </div>
                {commentPreview ? (
                  <div className="markdown-body preview-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{commentText}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    className="comment-textarea"
                    placeholder="Leave a comment… (Markdown supported)"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={5}
                  />
                )}
                <div className="comment-footer">
                  <button
                    className={`btn-state ${issue.state === 'open' ? 'btn-close' : 'btn-reopen'}`}
                    onClick={handleToggleState}
                    disabled={submitting}
                  >
                    {issue.state === 'open' ? 'Close issue' : 'Reopen issue'}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || submitting}
                  >
                    {submitting ? 'Posting…' : 'Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="detail-sidebar">
          <div className="sidebar-section">
            <h3>Labels</h3>
            {editing ? (
              <div className="label-picker">
                {labels.length === 0 ? (
                  <span className="sidebar-none">No labels in repo</span>
                ) : labels.map(label => {
                  const selected = editForm.selectedLabels.includes(label.name);
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
            ) : (
              <div className="sidebar-labels">
                {issue.labels.length === 0
                  ? <span className="sidebar-none">None yet</span>
                  : issue.labels.map(l => <LabelBadge key={l.id} label={l} />)
                }
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Assignees</h3>
            <div className="sidebar-assignees">
              {issue.assignees?.length === 0
                ? <span className="sidebar-none">No one assigned</span>
                : issue.assignees?.map(a => (
                    <div key={a.id} className="assignee-row">
                      <img src={a.avatar_url} alt={a.login} className="avatar-sm" />
                      <span>{a.login}</span>
                    </div>
                  ))
              }
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Info</h3>
            <div className="sidebar-info">
              <div className="info-row">
                <span className="info-key">Created</span>
                <span>{format(new Date(issue.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Updated</span>
                <span>{formatDistanceToNow(new Date(issue.updated_at), { addSuffix: true })}</span>
              </div>
              {issue.closed_at && (
                <div className="info-row">
                  <span className="info-key">Closed</span>
                  <span>{format(new Date(issue.closed_at), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-key">Comments</span>
                <span>{issue.comments}</span>
              </div>
            </div>
          </div>

          <a
            href={issue.html_url}
            target="_blank"
            rel="noreferrer"
            className="open-github-link"
          >
            Open on GitHub
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.75 2h3.5a.75.75 0 010 1.5h-3.5a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25v-3.5a.75.75 0 011.5 0v3.5A1.75 1.75 0 0112.25 14h-8.5A1.75 1.75 0 012 12.25v-8.5C2 2.784 2.784 2 3.75 2zm6.854-1h4.146a.25.25 0 01.25.25v4.146a.25.25 0 01-.427.177L13.03 4.03 9.28 7.78a.751.751 0 01-1.042-.018.751.751 0 01-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0110.604 1z"/>
            </svg>
          </a>
        </aside>
      </div>
    </div>
  );
}
