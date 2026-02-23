import React, { useState, useEffect } from 'react';
import api from '../api/client';
import './Dashboard.css';

export default function SenateDashboard() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', priority: 'medium', tags: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const qRes = await api.get('/questions');
      setQuestions(qRes.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const tagsArray =
        typeof form.tags === 'string'
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
      await api.post('/questions', {
        title: form.title,
        description: form.description,
        deadline: form.deadline || undefined,
        priority: form.priority || 'medium',
        tags: tagsArray,
      });
      setShowCreate(false);
      setForm({ title: '', description: '', deadline: '', priority: 'medium', tags: '' });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="glass p-4">Loading questions...</div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>My Senate Questions</h2>
        <div className="dashboard-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create Question
          </button>
        </div>
      </div>
      {error && <div className="auth-error mb-2">{error}</div>}
      {showCreate && (
        <div className="glass p-4 mb-4">
          <h3>New Question</h3>
          <form onSubmit={handleCreate}>
            <label>
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                required
              />
            </label>
            <label>
              Deadline (optional)
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </label>
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label>
              Tags (comma separated)
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="budget, policy, review"
              />
            </label>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="senate-vertical">
        {questions.map((q, idx) => (
          <section key={q._id} className="senate-item">
            <header className="senate-item-header">
              <div className="senate-left">
                <span className="senate-index">Q{idx + 1}</span>
                <h3 className="senate-title">{q.title}</h3>
              </div>
              <div className="senate-status">
                <span className={`badge badge-${q.status}`}>{q.status}</span>
                <span className="meta">Priority: {q.priority || 'medium'}</span>
              </div>
            </header>
            <p className="senate-description">{q.description}</p>
            <div className="senate-meta-row">
              <span className="meta">
                Department: {q.department?.departmentName || q.department?.name || 'Not assigned yet'}
              </span>
              <span className="meta ms-2">
                Created: {q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}
              </span>
            </div>
            {q.status === 'finalized' && q.finalAnswer && (
              <div className="senate-final-answer">
                <h4>Official Final Answer</h4>
                <pre className="final-answer">
                  {(q.finalAnswer || '').slice(0, 600)}{(q.finalAnswer || '').length > 600 ? '…' : ''}
                </pre>
                <div className="senate-actions">
                  <a href={`/senate/question/${q._id}`} className="btn btn-primary btn-sm">Open Question</a>
                </div>
              </div>
            )}
            {idx < questions.length - 1 && <div className="section-divider" aria-hidden="true" />}
          </section>
        ))}
      </div>
      {questions.length === 0 && !showCreate && (
        <p className="text-muted">No questions yet. Create one to get started.</p>
      )}
    </div>
  );
}
