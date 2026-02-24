import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './Dashboard.css';

export default function PradhikaranTrash() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/questions/trashed');
      setQuestions(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteForever = async (id) => {
    if (!window.confirm('Permanently delete this question? This cannot be undone.')) return;
    setDeleting(id);
    setError('');
    try {
      await api.delete(`/questions/${id}/permanent`);
      setQuestions((qs) => qs.filter((q) => q._id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to permanently delete');
    } finally {
      setDeleting('');
    }
  };

  if (loading) return <div className="glass p-4">Loading trash…</div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Trash</h2>
      </div>
      {error && <div className="auth-error mb-2">{error}</div>}
      <div className="card-grid">
        {questions.map((q, idx) => (
          <div key={q._id} className="glass card">
            <div className="d-flex align-items-center">
              <span className="question-index">Q{idx + 1}</span>
              <h4>{q.title}</h4>
              <button
                type="button"
                className="btn btn-danger btn-sm ms-auto"
                onClick={() => deleteForever(q._id)}
                disabled={deleting === q._id}
              >
                {deleting === q._id ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
            <p className="text-muted">{q.description?.slice(0, 120)}…</p>
            <span className="meta">
              Dept: {q.department?.departmentName || q.department?.name || q.department || '—'}
            </span>
            <span className="meta">Created: {q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</span>
            <span className="meta">Updated: {q.updatedAt ? new Date(q.updatedAt).toLocaleString() : '—'}</span>
          </div>
        ))}
      </div>
      {questions.length === 0 && <p className="text-muted">Trash is empty.</p>}
    </div>
  );
}
