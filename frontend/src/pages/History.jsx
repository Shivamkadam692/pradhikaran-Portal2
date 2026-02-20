import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ACTION_TYPE_GROUPS,
  ACTION_LABELS,
  DATE_PRESETS,
  STATUS_OPTIONS,
  ACTION_TYPE_OPTIONS,
} from '../constants/history';
import './History.css';

function formatTimestamp(ts) {
  if (!ts) return '–';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

function getDateRange(preset) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (preset === 'today') {
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (preset === 'last7') {
    start.setDate(start.getDate() - 6);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (preset === 'last30') {
    start.setDate(start.getDate() - 29);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  return {};
}

function describeLog(log) {
  const label = ACTION_LABELS[log.action] || log.action?.replace(/_/g, ' ') || 'Action';
  const meta = log.metadata || {};
  const parts = [];
  if (meta.title) parts.push(`"${meta.title}"`);
  if (meta.email) parts.push(meta.email);
  const extra = parts.length ? ` · ${parts.join(' ')}` : '';
  return { label, extra };
}

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const limit = 20;

  const [keyword, setKeyword] = useState('');
  const [datePreset, setDatePreset] = useState('last30');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionType, setActionType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (statusFilter) params.status = statusFilter;
      if (actionType && ACTION_TYPE_GROUPS[actionType]?.length) {
        params.action = ACTION_TYPE_GROUPS[actionType].join(',');
      }
      if (datePreset && datePreset !== 'custom') {
        const range = getDateRange(datePreset);
        if (range.dateFrom) params.dateFrom = range.dateFrom;
        if (range.dateTo) params.dateTo = range.dateTo;
      } else if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();

      const res = await api.get('/activity-logs/mine', { params });
      const data = res.data.data;
      setLogs(data.logs || []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 0);
    } catch (e) {
      setLogs([]);
      setTotal(0);
      setPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, datePreset, dateFrom, dateTo, actionType, statusFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleApplyFilters = (e) => {
    e?.preventDefault();
    setPage(1);
  };

  const handleExport = async (format) => {
    try {
      const params = { format: format || 'csv' };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (statusFilter) params.status = statusFilter;
      if (actionType && ACTION_TYPE_GROUPS[actionType]?.length) {
        params.action = ACTION_TYPE_GROUPS[actionType].join(',');
      }
      if (datePreset && datePreset !== 'custom') {
        const range = getDateRange(datePreset);
        if (range.dateFrom) params.dateFrom = range.dateFrom;
        if (range.dateTo) params.dateTo = range.dateTo;
      } else if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();

      const res = await api.get('/activity-logs/mine/export', {
        params,
        responseType: format === 'csv' ? 'blob' : 'json',
      });
      if (format === 'csv') {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `history-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `history-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const goToQuestion = (log) => {
    if (log.entityType !== 'Question' || !log.entityId) return;
    if (user?.role === 'PRADHIKARAN') {
      navigate(`/pradhikaran/question/${log.entityId}`);
    } else {
      navigate(`/question/${log.entityId}`);
    }
  };

  return (
    <div className="history-page">
      <div className="section-header">
        <h2>History</h2>
        <div className="history-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleExport('csv')}
            aria-label="Export as CSV"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleExport('json')}
            aria-label="Export as JSON"
          >
            Export JSON
          </button>
        </div>
      </div>
      <p className="text-muted mb-4">
        View and search your past actions. Use filters and search to find specific records.
      </p>

      <form className="history-filters glass p-4 mb-4" onSubmit={handleApplyFilters}>
        <div className="history-filters-grid">
          <label className="history-filter-label">
            Keyword search
            <input
              type="search"
              className="history-filter-input"
              placeholder="Search by title, action, type..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="Keyword search"
            />
          </label>
          <label className="history-filter-label">
            Date
            <select
              className="history-filter-input"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              aria-label="Date range preset"
            >
              {Object.entries(DATE_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          {datePreset === 'custom' && (
            <>
              <label className="history-filter-label">
                From
                <input
                  type="date"
                  className="history-filter-input"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="Date from"
                />
              </label>
              <label className="history-filter-label">
                To
                <input
                  type="date"
                  className="history-filter-input"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="Date to"
                />
              </label>
            </>
          )}
          <label className="history-filter-label">
            Action type
            <select
              className="history-filter-input"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              aria-label="Action type filter"
            >
              {ACTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="history-filter-label">
            Status
            <select
              className="history-filter-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status filter"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="history-filters-actions">
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
        </div>
      </form>

      {loading ? (
        <div className="glass p-4" aria-busy="true">Loading history...</div>
      ) : (
        <>
          <div className="history-timeline glass p-4" role="list" aria-label="Activity timeline">
            {logs.length === 0 ? (
              <p className="text-muted history-empty">No matching history records.</p>
            ) : (
              logs.map((log) => {
                const { label, extra } = describeLog(log);
                const isQuestion = log.entityType === 'Question';
                return (
                  <div
                    key={log._id}
                    className="history-timeline-item"
                    role="listitem"
                  >
                    <div className="history-timeline-marker" aria-hidden="true" />
                    <div className="history-timeline-content">
                      <div className="history-timeline-header">
                        <time dateTime={log.timestamp} className="history-timeline-time">
                          {formatTimestamp(log.timestamp)}
                        </time>
                        <span className={`badge badge-status-${log.status || 'success'}`}>
                          {log.status || 'success'}
                        </span>
                      </div>
                      <p className="history-timeline-title">
                        {label}
                        {extra && <span className="history-timeline-meta">{extra}</span>}
                      </p>
                      {log.user && (
                        <p className="history-timeline-user text-muted">
                          You · {log.user.name || log.user.email || log.user._id}
                        </p>
                      )}
                      {isQuestion && log.entityId && (
                        <button
                          type="button"
                          className="btn-link history-timeline-link"
                          onClick={() => goToQuestion(log)}
                        >
                          View question →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {pages > 1 && (
            <nav
              className="history-pagination"
              aria-label="History pagination"
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="history-pagination-info" aria-live="polite">
                Page {page} of {pages} ({total} total)
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                aria-label="Next page"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
