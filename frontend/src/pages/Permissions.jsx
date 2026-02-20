import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './Permissions.css';

export default function Permissions() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/pending-registrations');
      setPending(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load pending registrations');
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    setError('');
    try {
      await api.post(`/users/${userId}/approve`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (user) => {
    setRejectModal(user);
    setRejectReason('');
    setRejectError('');
  };

  const closeRejectModal = () => {
    setRejectModal(null);
    setRejectReason('');
    setRejectError('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      setRejectError('Reason must be at least 10 characters');
      return;
    }
    setRejectError('');
    setActionLoading(rejectModal._id);
    try {
      await api.post(`/users/${rejectModal._id}/reject`, { reason });
      closeRejectModal();
      await load();
    } catch (e) {
      setRejectError(e.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="glass p-4">Loading pending registrations...</div>;
  }

  return (
    <div className="permissions-page">
      <div className="section-header">
        <h2>Department Permissions</h2>
      </div>
      <p className="text-muted mb-4">
        Review and approve or reject department registration requests. Rejections require a reason that will be shared with the applicant.
      </p>
      {error && <div className="auth-error mb-4" role="alert">{error}</div>}

      <div className="glass p-4 permissions-card">
        <h3 className="permissions-card-title">Pending registration requests</h3>
        {pending.length === 0 ? (
          <p className="text-muted">No pending requests.</p>
        ) : (
          <div className="permissions-list">
            {pending.map((u) => (
              <div key={u._id} className="permissions-item glass">
                <div className="permissions-item-main">
                  <span className="permissions-item-name">{u.name}</span>
                  <span className="permissions-item-email">{u.email}</span>
                  {u.departmentName && (
                    <span className="permissions-item-dept badge badge-role">{u.departmentName}</span>
                  )}
                  <span className="permissions-item-status badge badge-pending">Pending</span>
                </div>
                <div className="permissions-item-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleApprove(u._id)}
                    disabled={actionLoading !== null}
                    aria-label={`Approve ${u.name}`}
                  >
                    {actionLoading === u._id ? 'Approving…' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => openRejectModal(u)}
                    disabled={actionLoading !== null}
                    aria-label={`Reject ${u.name}`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="permissions-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className="permissions-modal glass">
            <h3 id="reject-modal-title">Reject registration</h3>
            <p className="text-muted">
              Rejecting <strong>{rejectModal.name}</strong> ({rejectModal.email}). Provide a reason (required, min 10 characters). The applicant will be notified.
            </p>
            <form onSubmit={handleRejectSubmit}>
              <label className="permissions-modal-label">
                Reason for rejection <span className="required-asterisk">*</span>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Incomplete information; please re-register with a valid department."
                  rows={4}
                  required
                  minLength={10}
                  className="permissions-modal-textarea"
                  aria-describedby={rejectError ? 'reject-error' : undefined}
                />
              </label>
              {rejectError && (
                <p id="reject-error" className="auth-error mb-2" role="alert">{rejectError}</p>
              )}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeRejectModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={rejectReason.trim().length < 10 || actionLoading === rejectModal._id}
                >
                  {actionLoading === rejectModal._id ? 'Rejecting…' : 'Reject registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
