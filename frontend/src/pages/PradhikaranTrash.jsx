import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import api from '../api/client';
import './Dashboard.css';

export default function PradhikaranTrash() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');
  const [restoring, setRestoring] = useState('');

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

  const restoreQuestion = async (id) => {
    if (!window.confirm('Restore this question to active status?')) return;
    setRestoring(id);
    setError('');
    try {
      await api.post(`/questions/${id}/restore`);
      setQuestions((qs) => qs.filter((q) => q._id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to restore question');
    } finally {
      setRestoring('');
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
            <div className="d-flex align-items-center mb-3">
              <span className="question-index">Q{idx + 1}</span>
              <h4 className="m-0 ms-2">{q.title}</h4>
              <div className="ms-auto d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                  onClick={() => restoreQuestion(q._id)}
                  disabled={restoring === q._id || deleting === q._id}
                >
                  <RotateCcw size={16} />
                  {restoring === q._id ? 'Restoring…' : 'Restore'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                  onClick={() => deleteForever(q._id)}
                  disabled={deleting === q._id || restoring === q._id}
                >
                  <Trash2 size={16} />
                  {deleting === q._id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
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
