import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from '../api/client';
import DepartmentSelect from '../components/DepartmentSelect';
import History from './History';
import Permissions from './Permissions';
import './Dashboard.css';
import DepartmentsOverview from './DepartmentsOverview';
import DepartmentDetails from './DepartmentDetails';
import PradhikaranTrash from './PradhikaranTrash';

/* ── helpers ── */
function DeadlineChip({ deadline }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  let cls = 'ok', label = `Due ${d.toLocaleDateString()}`;
  if (diffDays < 0) { cls = 'overdue'; label = 'Overdue'; }
  else if (diffDays <= 3) { cls = 'soon'; label = `Due in ${diffDays}d`; }
  return <span className={`deadline-chip ${cls}`}>📅 {label}</span>;
}

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const STATUS_ORDER = ['open', 'locked', 'finalized'];

/* ── QuestionList ── */
function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', department: '',
    deadline: '', priority: 'medium', tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [qRes, dRes] = await Promise.all([
        api.get('/questions'),
        api.get('/users/departments'),
      ]);
      setQuestions(qRes.data.data);
      setDepartments(dRes.data.data);
      const uniqueDepts = [...new Set(
        dRes.data.data.filter(d => d.isApproved).map(d => (d.departmentName || d.name || '').trim())
      )].filter(Boolean);
      setDepartmentOptions(uniqueDepts.length > 0 ? uniqueDepts : undefined);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.department || form.department.trim() === '') {
      setError('Please select a department to assign this question to.');
      return;
    }
    const departmentUser = departments
      .filter(d => d.isApproved)
      .find(d => (d.departmentName || d.name || '').trim() === form.department.trim());
    if (!departmentUser) {
      setError(`No approved department user found for "${form.department}".`);
      return;
    }
    setSubmitting(true);
    try {
      const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/questions', {
        title: form.title,
        description: form.description,
        department: departmentUser._id,
        deadline: form.deadline || undefined,
        priority: form.priority,
        tags: tagsArr,
      });
      setShowCreate(false);
      setForm({ title: '', description: '', department: '', deadline: '', priority: 'medium', tags: '' });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = useMemo(() => {
    return questions.filter(q => {
      const matchStatus = !filterStatus || q.status === filterStatus;
      const dept = (q.department?.departmentName || q.department?.name || '').toLowerCase();
      const matchDept = !filterDept || dept.includes(filterDept.toLowerCase());
      const matchSearch = !search ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchDept && matchSearch;
    });
  }, [questions, filterStatus, filterDept, search]);

  if (loading) return <div className="glass p-4">Loading questions…</div>;

  return (
    <div className="dashboard-section">
      {/* Header */}
      <div className="section-header">
        <h2>My Questions <span className="answer-pill">{questions.length}</span></h2>
        <div className="dashboard-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
            {showCreate ? '✕ Cancel' : '+ Create Question'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/pradhikaran/departments')}>
            Departments
          </button>
        </div>
      </div>

      {error && <div className="auth-error mb-2">{error}</div>}

      {/* Create form */}
      {showCreate && (
        <div className="glass p-4 mb-4" style={{ borderLeft: '4px solid var(--indigo)' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Question</h3>
          <form onSubmit={handleCreate}>
            <label>
              Title
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                placeholder="Enter question title"
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                required
                placeholder="Describe the question in detail"
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="dashboard-form-field">
                <DepartmentSelect
                  id="pradhikaran-question-department"
                  label="Assign to Department"
                  value={form.department}
                  onChange={val => setForm(f => ({ ...f, department: val }))}
                  required
                  placeholder="Select department"
                  options={departmentOptions}
                />
              </div>
              <label>
                Priority
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </label>
              <label>
                Deadline (optional)
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                />
              </label>
              <label>
                Tags (comma-separated)
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. budget, urgent, 2024"
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          style={{ flex: '1', minWidth: '180px' }}
          placeholder="🔍 Search questions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ width: 'auto', minWidth: '130px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          style={{ width: 'auto', minWidth: '150px' }}
          placeholder="Filter by dept…"
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
        />
      </div>

      {/* Question cards */}
      <div className="card-grid">
        {displayed.map((q, idx) => {
          const dept = q.department?.departmentName || q.department?.name || '—';
          const hasAnswers = typeof q.answerCount === 'number';
          return (
            <div
              key={q._id}
              className="glass card card-hover"
              onClick={() => navigate(`/pradhikaran/question/${q._id}`)}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="question-index">Q{idx + 1}</span>
                <h4 style={{ flex: 1, marginBottom: 0 }}>{q.title}</h4>
              </div>
              <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                {q.description?.slice(0, 90)}{q.description?.length > 90 ? '…' : ''}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                <span className={`badge badge-${q.status}`}>{q.status}</span>
                {q.priority && (
                  <span className={`badge badge-${q.priority}`}>{PRIORITY_LABELS[q.priority]}</span>
                )}
                <DeadlineChip deadline={q.deadline} />
                {hasAnswers && (
                  <span className="answer-pill">💬 {q.answerCount}</span>
                )}
              </div>
              {q.tags && q.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {q.tags.map(t => (
                    <span key={t} style={{
                      fontSize: '0.7rem', padding: '0.15rem 0.5rem',
                      background: '#f1f5f9', borderRadius: '9999px',
                      color: 'var(--page-text-muted)', border: '1px solid var(--page-border)',
                    }}>{t}</span>
                  ))}
                </div>
              )}
              <span className="meta">🏢 {dept}</span>
            </div>
          );
        })}
      </div>

      {displayed.length === 0 && !showCreate && (
        <p className="text-muted" style={{ marginTop: '1rem' }}>
          {questions.length === 0 ? 'No questions yet. Create one to get started.' : 'No questions match your filters.'}
        </p>
      )}
    </div>
  );
}

/* ── Senate Inbox ── */
function SenateInbox() {
  const [questions, setQuestions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ department: '', priority: 'medium', tags: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [qRes, dRes] = await Promise.all([
        api.get('/questions/senate-inbox'),
        api.get('/users/departments'),
      ]);
      const qs = qRes.data.data || [];
      setQuestions(qs);
      setDepartments(dRes.data.data || []);
      const uniqueDepts = [...new Set(
        (dRes.data.data || []).filter(d => d.isApproved).map(d => (d.departmentName || d.name || '').trim())
      )].filter(Boolean);
      setDepartmentOptions(uniqueDepts.length > 0 ? uniqueDepts : undefined);
      if (qs.length > 0) setSelectedId(qs[0]._id);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = questions.find(q => q._id === selectedId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setError('');
    setSubmitting(true);
    try {
      let departmentId;
      if (form.department && form.department.trim() !== '') {
        const departmentUser = departments
          .filter(d => d.isApproved)
          .find(d => (d.departmentName || d.name || '').trim() === form.department.trim());
        if (!departmentUser) {
          setError(`No approved department user found for "${form.department}".`);
          setSubmitting(false);
          return;
        }
        departmentId = departmentUser._id;
      }
      const tagsArray = typeof form.tags === 'string'
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      await api.post(`/questions/${selectedId}/classify`, {
        departmentId,
        priority: form.priority || 'medium',
        tags: tagsArray,
        note: form.note || undefined,
      });
      const remaining = questions.filter(q => q._id !== selectedId);
      setQuestions(remaining);
      setSelectedId(remaining[0]?._id || '');
      setForm({ department: '', priority: 'medium', tags: '', note: '' });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to classify');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="glass p-4">Loading senate questions…</div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Senate Questions Inbox <span className="answer-pill">{questions.length}</span></h2>
      </div>
      {error && <div className="auth-error mb-2">{error}</div>}

      {questions.length === 0 ? (
        <div className="glass p-4 text-muted">✅ No unassigned senate questions.</div>
      ) : (
        <div className="senate-inbox-grid">
          {/* Left: question cards */}
          <div>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
              Select a question to classify
            </p>
            {questions.map((q, idx) => (
              <div
                key={q._id}
                className={`senate-q-card${selectedId === q._id ? ' selected' : ''}`}
                onClick={() => setSelectedId(q._id)}
                style={{ marginBottom: '0.5rem' }}
              >
                <div className="senate-q-card-title">Q{idx + 1}: {q.title}</div>
                <div className="senate-q-card-meta">
                  {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}
                  {q.createdBy?.name ? ` · ${q.createdBy.name}` : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Right: detail + classify form */}
          {selected && (
            <div className="glass p-4">
              <h3 style={{ marginBottom: '0.5rem' }}>{selected.title}</h3>
              <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                {selected.description}
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="dashboard-form-field">
                    <DepartmentSelect
                      id="senate-inbox-department"
                      label="Assign to Department"
                      value={form.department}
                      onChange={val => setForm(f => ({ ...f, department: val }))}
                      placeholder="Select department"
                      options={departmentOptions}
                    />
                  </div>
                  <label>
                    Priority
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">🟢 Low</option>
                      <option value="medium">🔵 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </label>
                  <label>
                    Tags (comma-separated)
                    <input
                      value={form.tags}
                      onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="e.g. urgent, 2024"
                    />
                  </label>
                  <label>
                    Note (optional)
                    <textarea
                      value={form.note}
                      onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      rows={2}
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting || !selectedId}>
                    {submitting ? 'Classifying…' : 'Classify & Assign'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PradhikaranDashboard() {
  return (
    <Routes>
      <Route index element={<QuestionList />} />
      <Route path="trash" element={<PradhikaranTrash />} />
      <Route path="departments" element={<DepartmentsOverview />} />
      <Route path="departments/:id" element={<DepartmentDetails />} />
      <Route path="history" element={<History />} />
      <Route path="permissions" element={<Permissions />} />
      <Route path="senate-inbox" element={<SenateInbox />} />
    </Routes>
  );
}
