import React, { useState, useEffect } from 'react';
import api from '../api/client';
import './Dashboard.css';

export default function TimeWindowManager() {
    const [windows, setWindows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ type: 'question', startDate: '', endDate: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ startDate: '', endDate: '', isActive: true });

    const load = async () => {
        try {
            const { data } = await api.get('/time-windows');
            setWindows(data.data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load time windows');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            await api.post('/time-windows', {
                type: form.type,
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
            });
            setForm({ type: 'question', startDate: '', endDate: '' });
            setShowCreate(false);
            setSuccess('Time window created successfully');
            load();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to create time window');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (id) => {
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            await api.put(`/time-windows/${id}`, {
                startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
                endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
                isActive: editForm.isActive,
            });
            setEditingId(null);
            setSuccess('Time window updated');
            load();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to update');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this time window?')) return;
        setError('');
        try {
            await api.delete(`/time-windows/${id}`);
            setSuccess('Time window deleted');
            load();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to delete');
        }
    };

    const startEdit = (tw) => {
        setEditingId(tw._id);
        setEditForm({
            startDate: tw.startDate ? new Date(tw.startDate).toISOString().slice(0, 16) : '',
            endDate: tw.endDate ? new Date(tw.endDate).toISOString().slice(0, 16) : '',
            isActive: tw.isActive,
        });
    };

    const getStatus = (tw) => {
        if (!tw.isActive) return { label: 'Inactive', cls: 'badge-locked' };
        const now = new Date();
        const start = new Date(tw.startDate);
        const end = new Date(tw.endDate);
        if (now < start) return { label: 'Upcoming', cls: 'badge-medium' };
        if (now > end) return { label: 'Expired', cls: 'badge-rejected' };
        return { label: 'Active', cls: 'badge-open' };
    };

    if (loading) return <div className="glass p-4">Loading time windows…</div>;

    return (
        <div>
            <div className="section-header">
                <h2>⏰ Time Window Manager</h2>
                <div className="dashboard-actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowCreate((v) => !v)}
                    >
                        {showCreate ? '✕ Cancel' : '+ Create Time Window'}
                    </button>
                </div>
            </div>

            {error && <div className="auth-error mb-2">{error}</div>}
            {success && <div className="auth-success mb-2" style={{ background: '#D1FAE5', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>{success}</div>}

            {showCreate && (
                <div className="glass p-4 mb-4" style={{ borderLeft: '4px solid var(--indigo)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>New Time Window</h3>
                    <form onSubmit={handleCreate}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <label>
                                Type
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                                >
                                    <option value="question">📝 Question Window (Senate)</option>
                                    <option value="answer">💬 Answer Window (Department)</option>
                                </select>
                            </label>
                            <label>
                                Start Date & Time
                                <input
                                    type="datetime-local"
                                    value={form.startDate}
                                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                                    required
                                />
                            </label>
                            <label>
                                End Date & Time
                                <input
                                    type="datetime-local"
                                    value={form.endDate}
                                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                                    required
                                />
                            </label>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Creating…' : 'Create Window'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--page-text-muted)' }}>
                <span><strong>📝 Question Window</strong> — Controls when Senate members can submit questions</span>
                <span><strong>💬 Answer Window</strong> — Controls when Departments can submit answers</span>
            </div>

            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
                {windows.map((tw) => {
                    const st = getStatus(tw);
                    const isEditing = editingId === tw._id;
                    return (
                        <div
                            key={tw._id}
                            className="glass card"
                            style={{
                                borderTop: `4px solid ${tw.type === 'question' ? '#3B82F6' : '#8B5CF6'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{tw.type === 'question' ? '📝' : '💬'}</span>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
                                            {tw.type === 'question' ? 'Question Window' : 'Answer Window'}
                                        </h4>
                                        <span className="meta">{tw.type === 'question' ? 'Senate Members' : 'Department Users'}</span>
                                    </div>
                                </div>
                                <span className={`badge ${st.cls}`}>{st.label}</span>
                            </div>

                            {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem' }}>
                                        Start
                                        <input
                                            type="datetime-local"
                                            value={editForm.startDate}
                                            onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                                        />
                                    </label>
                                    <label style={{ fontSize: '0.85rem' }}>
                                        End
                                        <input
                                            type="datetime-local"
                                            value={editForm.endDate}
                                            onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
                                        />
                                    </label>
                                    <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.isActive}
                                            onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                                        />
                                        Active
                                    </label>
                                    <div className="question-actions">
                                        <button className="btn btn-primary" disabled={submitting} onClick={() => handleUpdate(tw._id)}>
                                            {submitting ? 'Saving…' : 'Save'}
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <div>
                                            <span className="meta">Start:</span>
                                            <div style={{ fontWeight: 600 }}>
                                                {new Date(tw.startDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="meta">End:</span>
                                            <div style={{ fontWeight: 600 }}>
                                                {new Date(tw.endDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    {tw.createdBy && (
                                        <span className="meta">Created by: {tw.createdBy.name || tw.createdBy.email}</span>
                                    )}
                                    <div className="question-actions">
                                        <button className="btn btn-outline" onClick={() => startEdit(tw)}>✏️ Edit</button>
                                        <button className="btn btn-secondary" onClick={() => handleDelete(tw._id)}>🗑 Delete</button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {windows.length === 0 && (
                <p className="text-muted" style={{ marginTop: '1rem' }}>
                    No time windows have been created yet. Create one to control when questions and answers can be submitted.
                </p>
            )}
        </div>
    );
}
