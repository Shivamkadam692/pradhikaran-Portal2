import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from '../api/client';
import DepartmentSelect from '../components/DepartmentSelect';
import History from './History';
import Permissions from './Permissions';
import './Dashboard.css';
import DepartmentsOverview from './DepartmentsOverview';
import DepartmentDetails from './DepartmentDetails';

function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', department: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [qRes, dRes] = await Promise.all([
        api.get('/questions'),
        api.get('/users/departments'),
      ]);
      setQuestions(qRes.data.data);
      setDepartments(dRes.data.data);
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
    if (!form.department || form.department.trim() === '') {
      setError('Please select a department to assign this question to.');
      return;
    }
    const departmentUser = departments
      .filter((d) => d.isApproved)
      .find(
        (d) => (d.departmentName || d.name || '').trim() === form.department.trim()
      );
    if (!departmentUser) {
      setError(
        `No approved department user found for "${form.department}". Ensure at least one user is registered and approved in that department.`
      );
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/questions', {
        title: form.title,
        description: form.description,
        department: departmentUser._id,
        deadline: form.deadline || undefined,
      });
      setShowCreate(false);
      setForm({ title: '', description: '', department: '', deadline: '' });
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
        <h2>My Questions</h2>
        <div className="dashboard-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create Question
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/pradhikaran/departments')}>
            Departments
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
            <div className="dashboard-form-field">
              <DepartmentSelect
                id="pradhikaran-question-department"
                label="Assign to Department"
                value={form.department}
                onChange={(val) => setForm((f) => ({ ...f, department: val }))}
                required
                placeholder="Select department"
              />
            </div>
            <label>
              Deadline (optional)
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
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
      <div className="card-grid">
        {questions.map((q, idx) => (
          <div
            key={q._id}
            className="glass card card-hover"
            onClick={() => navigate(`/pradhikaran/question/${q._id}`)}
          >
            <div className="d-flex align-items-center">
              <span className="question-index">Q{idx + 1}</span>
              <h4>{q.title}</h4>
            </div>
            <p className="text-muted">{q.description?.slice(0, 100)}...</p>
            <span className={`badge badge-${q.status}`}>{q.status}</span>
            <span className="meta">
              Dept: {q.department?.departmentName || q.department?.name || q.department}
            </span>
            <span className="meta">Created: {q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</span>
          </div>
        ))}
      </div>
      {questions.length === 0 && !showCreate && (
        <p className="text-muted">No questions yet. Create one to get started.</p>
      )}
    </div>
  );
}

function SenateInbox() {
  const [questions, setQuestions] = useState([]);
  const [departments, setDepartments] = useState([]);
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
      setQuestions(qRes.data.data || []);
      setDepartments(dRes.data.data || []);
      if (qRes.data.data && qRes.data.data.length > 0) {
        setSelectedId(qRes.data.data[0]._id);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setError('');
    setSubmitting(true);
    try {
      let departmentId;
      if (form.department && form.department.trim() !== '') {
        const departmentUser = departments
          .filter((d) => d.isApproved)
          .find(
            (d) => (d.departmentName || d.name || '').trim() === form.department.trim()
          );
        if (!departmentUser) {
          setError(
            `No approved department user found for "${form.department}". Ensure at least one user is registered and approved in that department.`
          );
          setSubmitting(false);
          return;
        }
        departmentId = departmentUser._id;
      }
      const tagsArray =
        typeof form.tags === 'string'
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
      await api.post(`/questions/${selectedId}/classify`, {
        departmentId,
        priority: form.priority || 'medium',
        tags: tagsArray,
        note: form.note || undefined,
      });
      const remaining = questions.filter((q) => q._id !== selectedId);
      setQuestions(remaining);
      setSelectedId(remaining[0]?._id || '');
      setForm({ department: '', priority: 'medium', tags: '', note: '' });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to classify');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="glass p-4">Loading senate questions...</div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Senate Questions Inbox</h2>
      </div>
      {error && <div className="auth-error mb-2">{error}</div>}
      {questions.length === 0 ? (
        <div className="glass p-4">No unassigned senate questions.</div>
      ) : (
        <div className="glass p-4">
          <form onSubmit={handleSubmit}>
            <label>
              Select Question
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {questions.map((q, idx) => (
                  <option key={q._id} value={q._id}>
                    Q{idx + 1}: {q.title} — {q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}
                  </option>
                ))}
              </select>
            </label>
            <div className="dashboard-form-field">
              <DepartmentSelect
                id="senate-inbox-department"
                label="Assign to Department"
                value={form.department}
                onChange={(val) => setForm((f) => ({ ...f, department: val }))}
                placeholder="Select department"
              />
            </div>
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
              />
            </label>
            <label>
              Note (optional)
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={3}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting || !selectedId}>
                Classify and Assign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function PradhikaranDashboard() {
  return (
    <Routes>
      <Route index element={<QuestionList />} />
      <Route path="departments" element={<DepartmentsOverview />} />
      <Route path="departments/:id" element={<DepartmentDetails />} />
      <Route path="history" element={<History />} />
      <Route path="permissions" element={<Permissions />} />
      <Route path="senate-inbox" element={<SenateInbox />} />
    </Routes>
  );
}
