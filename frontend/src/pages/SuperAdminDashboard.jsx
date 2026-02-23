import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useSuperAdminApi } from '../api/superAdminClient';
import './Dashboard.css';

export default function SuperAdminDashboard() {
  const superAdminApi = useSuperAdminApi();
  const [analytics, setAnalytics] = useState(null);
  const [pradhikaran, setPradhikaran] = useState([]);
  const [senate, setSenate] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [createAuditorOpen, setCreateAuditorOpen] = useState(false);
  const [auditorForm, setAuditorForm] = useState({ name: '', email: '', password: '' });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [createSenateOpen, setCreateSenateOpen] = useState(false);
  const [senateForm, setSenateForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [aRes, prRes, sRes, qRes, lRes, auRes] = await Promise.all([
        superAdminApi.get('/analytics').catch(() => ({ success: true, data: {} })),
        superAdminApi.get('/users/pradhikaran').catch(() => ({ success: true, data: [] })),
        superAdminApi.get('/users/senate').catch(() => ({ success: true, data: [] })),
        superAdminApi.get('/questions/all').catch(() => ({ success: true, data: [] })),
        superAdminApi.get('/activity-logs?limit=30').catch(() => ({ success: true, data: { logs: [] } })),
        superAdminApi.get('/users/auditor').catch(() => ({ success: true, data: [] })),
      ]);
      setAnalytics(aRes?.data || {});
      setPradhikaran(Array.isArray(prRes?.data) ? prRes.data : []);
      setSenate(Array.isArray(sRes?.data) ? sRes.data : []);
      setQuestions(Array.isArray(qRes?.data) ? qRes.data : []);
      setAuditors(Array.isArray(auRes?.data) ? auRes.data : []);
      setLogs(Array.isArray(lRes?.data?.logs) ? lRes.data.logs : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreatePradhikaran = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await superAdminApi.post('/users/pradhikaran', form);
      setCreateOpen(false);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSenate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await superAdminApi.post('/users/senate', senateForm);
      setCreateSenateOpen(false);
      setSenateForm({ name: '', email: '', password: '' });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAuditor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await superAdminApi.post('/users/auditor', auditorForm);
      setCreateAuditorOpen(false);
      setAuditorForm({ name: '', email: '', password: '' });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="glass p-4">Loading...</div>;

  return (
    <div className="dashboard-section">
      <h2>Super Admin</h2>
      <p className="text-muted mb-4">Manage Pradhikaran accounts, view analytics and audit logs. Department registration approvals are handled by Pradhikaran role.</p>
      {error && <div className="auth-error mb-4">{error}</div>}

      {analytics && (
        <div className="metric-grid mb-4">
          <div className="glass metric-card card-hover">
            <div className="value">{analytics.totalQuestions ?? 0}</div>
            <div className="label">Total Questions</div>
          </div>
          <div className="glass metric-card card-hover">
            <div className="value">{analytics.totalAnswers ?? 0}</div>
            <div className="label">Total Answers</div>
          </div>
          <div className="glass metric-card card-hover">
            <div className="value">{analytics.pendingReviews ?? 0}</div>
            <div className="label">Pending Reviews</div>
          </div>
          <div className="glass metric-card card-hover">
            <div className="value">{analytics.approvedRegistrations ?? 0}</div>
            <div className="label">Approved Departments</div>
          </div>
          <div className="glass metric-card card-hover">
            <div className="value">{analytics.lockedQuestions ?? 0}</div>
            <div className="label">Locked Questions</div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="glass p-4 mb-4">
          <div className="section-header">
            <h3>Pradhikaran Accounts</h3>
            <button type="button" className="btn btn-primary small" onClick={() => setCreateOpen(true)}>
              Create
            </button>
          </div>
          {createOpen && (
            <form onSubmit={handleCreatePradhikaran} className="mb-4">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <input
                type="password"
                placeholder="Password (optional)"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Create</button>
              </div>
            </form>
          )}
          <ul className="list-unstyled">
            {pradhikaran.map((u) => (
              <li key={u._id}>{u.name} – {u.email}</li>
            ))}
          </ul>
        </div>
        <div className="glass p-4 mb-4">
          <div className="section-header">
            <h3>Senate Accounts</h3>
            <button type="button" className="btn btn-primary small" onClick={() => setCreateSenateOpen(true)}>
              Create
            </button>
          </div>
          {createSenateOpen && (
            <form onSubmit={handleCreateSenate} className="mb-4">
              <input
                placeholder="Name"
                value={senateForm.name}
                onChange={(e) => setSenateForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={senateForm.email}
                onChange={(e) => setSenateForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={senateForm.password}
                onChange={(e) => setSenateForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateSenateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Create</button>
              </div>
            </form>
          )}
          <ul className="list-unstyled">
            {senate.map((u) => (
              <li key={u._id}>{u.name} – {u.email}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass p-4 mb-4">
        <div className="section-header">
          <h3>Auditor Accounts</h3>
          <button type="button" className="btn btn-primary small" onClick={() => setCreateAuditorOpen(true)}>
            Create
          </button>
        </div>
        {createAuditorOpen && (
          <form onSubmit={handleCreateAuditor} className="mb-4">
            <input
              placeholder="Name"
              value={auditorForm.name}
              onChange={(e) => setAuditorForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={auditorForm.email}
              onChange={(e) => setAuditorForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={auditorForm.password}
              onChange={(e) => setAuditorForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setCreateAuditorOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>Create</button>
            </div>
          </form>
        )}
        <ul className="list-unstyled">
          {auditors.map((u) => (
            <li key={u._id}>{u.name} – {u.email}</li>
          ))}
        </ul>
      </div>

      <div className="glass p-4 mb-4">
        <h3>Recent Audit Logs</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.user?.name || log.user?.email || '–'}</td>
                  <td>{log.action}</td>
                  <td>{log.entityType} {log.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
