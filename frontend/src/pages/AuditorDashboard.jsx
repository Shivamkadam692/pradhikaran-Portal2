import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './Dashboard.css';

function PendingList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [review, setReview] = useState({ comment: '', reason: '' });
  const [actingId, setActingId] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/audit/pending');
      setQuestions(data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    setActingId(id);
    setError('');
    try {
      await api.post(`/audit/${id}/approve`, { comment: review.comment || undefined });
      setQuestions((qs) => qs.filter((q) => q._id !== id));
      setReview({ comment: '', reason: '' });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to approve');
    } finally {
      setActingId('');
    }
  };

  const handleReject = async (id) => {
    setActingId(id);
    setError('');
    try {
      await api.post(`/audit/${id}/reject`, { reason: review.reason || '' });
      setQuestions((qs) => qs.filter((q) => q._id !== id));
      setReview({ comment: '', reason: '' });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reject');
    } finally {
      setActingId('');
    }
  };

  if (loading) return <div className="glass p-4">Loading pending questions...</div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Pending Senate Questions</h2>
      </div>
      {error && <div className="auth-error mb-2">{error}</div>}
      <div className="card-grid">
        {questions.map((q, idx) => (
          <div key={q._id} className="glass card">
            <div className="d-flex align-items-center">
              <span className="question-index">Q{idx + 1}</span>
              <h4>{q.title}</h4>
            </div>
            <p className="text-muted">{q.description}</p>
            <div className="senate-meta-row">
              <span className="meta">From Senate: {q.createdBy?.name || 'N/A'}</span>
              <span className="meta ms-2">Created: {q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</span>
            </div>
            <div className="form-group">
              <label>Approval comment (optional)</label>
              <input
                value={review.comment}
                onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                placeholder="Short note to accompany approval"
              />
            </div>
            <div className="form-group">
              <label>Rejection reason (min 5 chars)</label>
              <input
                value={review.reason}
                onChange={(e) => setReview((r) => ({ ...r, reason: e.target.value }))}
                placeholder="Reason for rejection"
              />
            </div>
            <div className="question-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleApprove(q._id)}
                disabled={!!actingId}
              >
                {actingId === q._id ? 'Approving...' : 'Approve'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleReject(q._id)}
                disabled={!!actingId || (review.reason || '').trim().length < 5}
              >
                {actingId === q._id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {questions.length === 0 && <p className="text-muted">No pending questions.</p>}
    </div>
  );
}

function ApprovedList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/audit/approved');
      setQuestions(data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const forwardSelected = async () => {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (ids.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/audit/forward', { questionIds: ids });
      const remaining = questions.filter((q) => !ids.includes(q._id));
      setQuestions(remaining);
      setSelected({});
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to forward');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="glass p-4">Loading approved questions...</div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Approved — Ready to Forward</h2>
        <div className="dashboard-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={forwardSelected}
            disabled={submitting || Object.values(selected).filter(Boolean).length === 0}
            title="Send selected questions to Pradhikaran"
          >
            {submitting ? 'Forwarding…' : `Forward Selected (${Object.values(selected).filter(Boolean).length})`}
          </button>
        </div>
      </div>
      {error && <div className="auth-error mb-2">{error}</div>}
      <div className="card-grid">
        {questions.map((q, idx) => {
          const inputId = `chk-${q._id}`;
          const isChecked = !!selected[q._id];
          return (
            <div key={q._id} className="glass card select-card">
              <div className="select-row">
                <label htmlFor={inputId} className="flex-1">
                  <div className="d-flex align-items-center">
                    <span className="question-index">Q{idx + 1}</span>
                    <h4>{q.title}</h4>
                  </div>
                  <p className="text-muted">{q.description}</p>
                  <div className="senate-meta-row">
                    <span className="meta">Created: {q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</span>
                    <span className="meta ms-2">From Senate: {q.createdBy?.name || 'N/A'}</span>
                  </div>
                </label>
                <input
                  id={inputId}
                  type="checkbox"
                  className="select-checkbox"
                  checked={isChecked}
                  onChange={() => toggle(q._id)}
                  aria-label={`Select question ${q.title}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {questions.length === 0 && <p className="text-muted">No approved items to forward.</p>}
    </div>
  );
}

function DraftsList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [actingId, setActingId] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/audit/drafts');
      setQuestions(data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resubmit = async (id) => {
    setActingId(id);
    setError('');
    try {
      await api.post(`/audit/${id}/resubmit`, { comment: comment || undefined });
      setQuestions((qs) => qs.filter((q) => q._id !== id));
      setComment('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resubmit');
    } finally {
      setActingId('');
    }
  };

  if (loading) return <div className="glass p-4">Loading drafts...</div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Drafts (Rejected)</h2>
      </div>
      {error && <div className="auth-error mb-2">{error}</div>}
      <div className="card-grid">
        {questions.map((q, idx) => (
          <div key={q._id} className="glass card">
            <div className="d-flex align-items-center">
              <span className="question-index">Q{idx + 1}</span>
              <h4>{q.title}</h4>
            </div>
            <p className="text-muted">{q.description}</p>
            <span className="meta">Created: {q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</span>
            <div className="form-group">
              <label>Resubmission comment (optional)</label>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comment for resubmission"
              />
            </div>
            <div className="question-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => resubmit(q._id)}
                disabled={!!actingId}
              >
                {actingId === q._id ? 'Resubmitting...' : 'Resubmit for Review'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {questions.length === 0 && <p className="text-muted">No drafts.</p>}
    </div>
  );
}

export default function AuditorDashboard() {
  const [tab, setTab] = useState('pending');
  const [generating, setGenerating] = useState('');
  const [sendingR1, setSendingR1] = useState(false);

  const handleDownload = async (reportKey, endpoint) => {
    setGenerating(reportKey);
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportKey}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.response?.data?.message || `Failed to generate ${reportKey.toUpperCase()} report`);
    } finally {
      setGenerating('');
    }
  };

  const handleSendR1 = async () => {
    setSendingR1(true);
    try {
      await api.post('/audit/send-r1');
      alert('R1 report sent to Pradhikaran successfully!');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send R1 report');
    } finally {
      setSendingR1(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Auditor</h2>
        <div className="dashboard-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <button type="button" className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('pending')}>Pending</button>
          <button type="button" className={`btn ${tab === 'approved' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('approved')}>Approved</button>
          <button type="button" className={`btn ${tab === 'drafts' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('drafts')}>Drafts</button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!!generating}
            onClick={() => handleDownload('r1', '/export/report-r1')}
            title="Download R1 — All received questions report"
          >
            {generating === 'r1' ? '⏳ R1...' : '📥 R1 Report'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!!generating}
            onClick={() => handleDownload('r2', '/export/report-r2')}
            title="Download R2 — Sorted questions report"
          >
            {generating === 'r2' ? '⏳ R2...' : '📊 R2 Report'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={sendingR1}
            onClick={handleSendR1}
            title="Send R1 report to Pradhikaran"
            style={{ background: '#10B981', borderColor: '#10B981' }}
          >
            {sendingR1 ? '⏳ Sending...' : '📨 Send R1 to Pradhikaran'}
          </button>
        </div>
      </div>
      {tab === 'pending' && <PendingList />}
      {tab === 'approved' && <ApprovedList />}
      {tab === 'drafts' && <DraftsList />}
    </div>
  );
}
