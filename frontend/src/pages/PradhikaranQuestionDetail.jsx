import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import './QuestionDetail.css';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

function DeadlineChip({ deadline }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const diffDays = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  let cls = 'ok', label = d.toLocaleDateString();
  if (diffDays < 0) { cls = 'overdue'; label = 'Overdue'; }
  else if (diffDays <= 3) { cls = 'soon'; label = `Due in ${diffDays}d`; }
  return <span className={`deadline-chip ${cls}`}>📅 {label}</span>;
}

/* Single answer card with inline remark field */
function AnswerCard({ answer: a, questionStatus, onSetStatus, onCopyToFinal, includeInFinal, onToggleInclude }) {
  const [expanded, setExpanded] = useState(false);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [expandedVersions, setExpandedVersions] = useState(false);
  const canAct = questionStatus !== 'finalized' && questionStatus !== 'locked' && a.status === 'pending_review';

  const handleUpdateRequest = () => {
    if (!remark.trim()) return;
    onSetStatus(a._id, 'update_requested', remark);
    setRemarkOpen(false);
    setRemark('');
  };

  return (
    <div className="answer-accordion-item">
      <div className="answer-accordion-header" onClick={() => setExpanded(v => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="answer-dept-name">
            {a.department?.departmentName || a.department?.name || 'Department'}
          </span>
          <span className={`badge badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>v{a.version}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onToggleInclude && (
            <label onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeInFinal || false} onChange={onToggleInclude} />
              Include
            </label>
          )}
          <span style={{ color: 'var(--page-text-muted)', fontSize: '0.75rem' }}>
            {new Date(a.createdAt).toLocaleDateString()}
          </span>
          <span style={{ color: 'var(--page-text-muted)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="answer-accordion-body">
          <div className="answer-content" dangerouslySetInnerHTML={{ __html: a.content || a.content || '' }} />

          {a.attachments && a.attachments.length > 0 && (
            <div className="attachments-section mt-3">
              <h5 style={{ marginBottom: '0.5rem' }}>📎 Attached Files</h5>
              <div className="attachments-list">
                {a.attachments.map((att, i) => (
                  <div key={i} className="attachment-item">
                    <a href={`/uploads/${att.path}`} target="_blank" rel="noopener noreferrer" className="attachment-link">
                      {att.originalName} ({(att.size / 1024).toFixed(1)} KB)
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.previousVersions?.length > 0 && (
            <div className="mt-3">
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                onClick={() => setExpandedVersions(v => !v)}>
                {expandedVersions ? 'Hide' : 'Show'} {a.previousVersions.length} previous version(s)
              </button>
              {expandedVersions && (
                <ul className="previous-versions mt-2">
                  {a.previousVersions.map((v, i) => (
                    <li key={i} className="mb-2">
                      <div className="text-muted small">v{v.version} – {new Date(v.submittedAt).toLocaleString()}</div>
                      <pre className="small-pre bg-light p-2 rounded">{v.content?.slice(0, 200)}…</pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="answer-accordion-actions">
            {canAct && (
              <>
                <button type="button" className="btn btn-success" style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}
                  onClick={() => onSetStatus(a._id, 'accepted')}>
                  ✓ Accept
                </button>
                <button type="button" className="btn btn-danger" style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}
                  onClick={() => onSetStatus(a._id, 'rejected')}>
                  ✕ Reject
                </button>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}
                  onClick={() => setRemarkOpen(v => !v)}>
                  ✏️ Request Update
                </button>
              </>
            )}
            {onCopyToFinal && (
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}
                onClick={() => onCopyToFinal(a.content)}>
                📋 Copy to Final
              </button>
            )}
          </div>

          {remarkOpen && (
            <div className="remark-field">
              <textarea
                placeholder="Explain what needs to be updated…"
                value={remark}
                onChange={e => setRemark(e.target.value)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button type="button" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}
                  onClick={handleUpdateRequest} disabled={!remark.trim()}>
                  Send
                </button>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}
                  onClick={() => { setRemarkOpen(false); setRemark(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PradhikaranQuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalAnswerText, setFinalAnswerText] = useState('');
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [compileAnswers, setCompileAnswers] = useState({});

  const load = async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        api.get(`/questions/${id}`),
        api.get(`/questions/${id}/answers`).catch(() => ({ data: { data: [] } })),
      ]);
      setQuestion(qRes.data.data);
      const ans = aRes.data.data || [];
      setAnswers(ans);
      const initial = {};
      ans.forEach(a => { initial[a._id] = a.status === 'accepted'; });
      setCompileAnswers(initial);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Move this question to Trash?')) return;
    try {
      await api.delete(`/questions/${id}`);
      navigate('/pradhikaran/trash');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed');
    }
  };

  const setAnswerStatus = async (answerId, status, remark = '') => {
    try {
      await api.post(`/answers/${answerId}/status`, { status, remark });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed');
    }
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/questions/${id}/finalize`, { finalAnswer: finalAnswerText });
      setFinalizeOpen(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to finalize');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToFinal = (text) => {
    setFinalAnswerText(prev => prev ? prev + '\n\n---\n\n' + text : text);
  };

  const generateFinalAnswerFromSelected = () => {
    const selected = answers.filter(a => compileAnswers[a._id]);
    setFinalAnswerText(selected.map(a => a.content).join('\n\n---\n\n'));
  };

  const acceptedAnswers = answers.filter(a => a.status === 'accepted');
  const canEdit = question?.status === 'open';
  const canFinalize = question?.status !== 'finalized' && acceptedAnswers.length > 0;
  const canDelete = question?.status === 'locked' || question?.status === 'open';

  if (loading) return <div className="glass p-4">Loading…</div>;
  if (!question) return <div className="glass p-4">Question not found.</div>;

  return (
    <div className="question-detail">
      <button type="button" className="btn btn-secondary mb-4" onClick={() => navigate('/pradhikaran')}>
        ← Back
      </button>
      {error && <div className="auth-error mb-4">{error}</div>}

      {/* Question header */}
      <div className="glass p-4 mb-4">
        <h1>{question.title}</h1>
        <p className="description">{question.description}</p>
        <div className="q-info-strip">
          <div className="q-info-item">
            <span>Status:</span>
            <span className={`badge badge-${question.status}`}>{question.status}</span>
          </div>
          {question.priority && (
            <div className="q-info-item">
              <span>Priority:</span>
              <span className={`badge badge-${question.priority}`}>{PRIORITY_LABELS[question.priority]}</span>
            </div>
          )}
          {question.deadline && (
            <div className="q-info-item">
              <DeadlineChip deadline={question.deadline} />
            </div>
          )}
          {question.department && (
            <div className="q-info-item">
              🏢 <strong>{question.department.departmentName || question.department.name}</strong>
            </div>
          )}
          <div className="q-info-item">
            💬 <strong>{answers.length}</strong> answer{answers.length !== 1 ? 's' : ''}
          </div>
        </div>
        {question.tags && question.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {question.tags.map(t => (
              <span key={t} style={{
                fontSize: '0.75rem', padding: '0.15rem 0.5rem',
                background: '#f1f5f9', borderRadius: '9999px',
                color: 'var(--page-text-muted)', border: '1px solid var(--page-border)',
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Unified toolbar */}
      <div className="q-toolbar mb-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            try {
              const res = await api.get(`/export/question/${id}`, { responseType: 'blob' });
              const url = URL.createObjectURL(res.data);
              const a = document.createElement('a');
              a.href = url; a.download = `question-${id}.pdf`; a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              setError(e.response?.data?.message || 'Export failed');
            }
          }}
        >
          ⬇ Export PDF
        </button>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/pradhikaran/all-received-answers')}>
          View All Received Answers
        </button>
        {canFinalize && (
          <button type="button" className="btn btn-primary" onClick={() => setFinalizeOpen(true)}>
            ✓ Finalize Question
          </button>
        )}
        {canDelete && (
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            🗑 Move to Trash
          </button>
        )}
      </div>

      {/* Published final answer */}
      {question.status === 'finalized' && question.finalAnswer && (
        <div className="glass p-4 mb-4" style={{ borderLeft: '4px solid var(--indigo)' }}>
          <h3>✅ Final Answer (Published)</h3>
          <pre className="final-answer">{question.finalAnswer}</pre>
          <p className="meta">
            Published: {question.finalAnswerPublishedAt && new Date(question.finalAnswerPublishedAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* Inline answers accordion */}
      {answers.length > 0 && (
        <div className="glass p-4 mb-4">
          <h3 style={{ marginBottom: '1rem' }}>
            Received Answers ({answers.length})
          </h3>
          {answers.map(a => (
            <AnswerCard
              key={a._id}
              answer={a}
              questionStatus={question.status}
              onSetStatus={setAnswerStatus}
              onCopyToFinal={copyToFinal}
              includeInFinal={compileAnswers[a._id]}
              onToggleInclude={() => setCompileAnswers(prev => ({ ...prev, [a._id]: !prev[a._id] }))}
            />
          ))}
        </div>
      )}

      {answers.length === 0 && (
        <div className="glass p-4 mb-4 text-muted">No answers received yet.</div>
      )}

      {/* Finalize slide-in panel */}
      {finalizeOpen && (
        <div className="modal-overlay" onClick={() => setFinalizeOpen(false)}>
          <div className="glass modal-content finalize-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Finalize Question</h2>
              <button type="button" onClick={() => setFinalizeOpen(false)}>×</button>
            </div>
            <p className="text-muted mb-4">Compile accepted answers into the official final answer.</p>

            {acceptedAnswers.length > 0 && (
              <div className="accepted-copies mb-4">
                <h4 style={{ marginBottom: '0.75rem' }}>Accepted Answers</h4>
                {acceptedAnswers.map(a => (
                  <div key={a._id} className="glass p-3 mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{a.department?.departmentName || a.department?.name}</strong>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                        <input
                          type="checkbox"
                          checked={compileAnswers[a._id] || false}
                          onChange={() => setCompileAnswers(prev => ({ ...prev, [a._id]: !prev[a._id] }))}
                        />
                        Include in final
                      </label>
                    </div>
                    <pre className="small-pre mt-2 bg-light p-2 rounded">{a.content?.slice(0, 300)}…</pre>
                    <button type="button" className="btn btn-secondary" style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                      onClick={() => copyToFinal(a.content)}>
                      📋 Copy Content
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-primary" style={{ marginBottom: '1rem' }}
                  onClick={generateFinalAnswerFromSelected}>
                  Generate from Selected
                </button>
              </div>
            )}

            <label>
              Final Answer (Editable)
              <textarea
                value={finalAnswerText}
                onChange={e => setFinalAnswerText(e.target.value)}
                rows={12}
                className="form-control mt-2"
                style={{ width: '100%' }}
                placeholder="Combine and edit content from answers above to create the official final answer…"
              />
            </label>

            <div className="form-actions mt-3">
              <button type="button" className="btn btn-secondary" onClick={() => setFinalizeOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleFinalize}>
                {submitting ? 'Processing…' : 'Confirm Finalization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
