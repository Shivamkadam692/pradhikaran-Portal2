import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import './QuestionDetail.css';

export default function PradhikaranQuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAnswers, setViewAnswers] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalAnswerText, setFinalAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedVersions, setExpandedVersions] = useState({});
  const [compileAnswers, setCompileAnswers] = useState({});

  const load = async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        api.get(`/questions/${id}`),
        api.get(`/questions/${id}/answers`).catch(() => ({ data: { data: [] } })),
      ]);
      setQuestion(qRes.data.data);
      setAnswers(aRes.data.data || []);
      
      // Initialize compile answers state
      const initialCompileState = {};
      aRes.data.data?.forEach(answer => {
        initialCompileState[answer._id] = answer.status === 'accepted';
      });
      setCompileAnswers(initialCompileState);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

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
    setFinalAnswerText((prev) => (prev ? prev + '\n\n---\n\n' + text : text));
  };

  const toggleCompileAnswer = (answerId) => {
    setCompileAnswers(prev => ({
      ...prev,
      [answerId]: !prev[answerId]
    }));
  };

  const generateFinalAnswerFromSelected = () => {
    const selectedAnswers = answers.filter(a => compileAnswers[a._id]);
    const compiledText = selectedAnswers.map(a => a.content).join('\n\n---\n\n');
    setFinalAnswerText(compiledText);
  };

  const acceptedAnswers = answers.filter((a) => a.status === 'accepted');
  const canEdit = question?.status === 'open';
  const canFinalize = question?.status !== 'finalized' && acceptedAnswers.length > 0;
  const canDelete = question?.status === 'locked' || question?.status === 'open';

  if (loading) return <div className="glass p-4">Loading...</div>;
  if (!question) return <div className="glass p-4">Question not found.</div>;

  return (
    <div className="question-detail">
      <button type="button" className="btn btn-secondary mb-4" onClick={() => navigate('/pradhikaran')}>
        ← Back
      </button>
      {error && <div className="auth-error mb-4">{error}</div>}

      <div className="glass p-4 mb-4">
        <h1>{question.title}</h1>
        <p className="description">{question.description}</p>
        <span className={`badge badge-${question.status}`}>{question.status}</span>
        {question.deadline && (
          <span className="meta">Deadline: {new Date(question.deadline).toLocaleString()}</span>
        )}
      </div>

      <div className="actions-bar glass p-4 mb-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            try {
              const res = await api.get(`/export/question/${id}`, { responseType: 'blob' });
              const url = URL.createObjectURL(res.data);
              const a = document.createElement('a');
              a.href = url;
              a.download = `question-${id}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              setError(e.response?.data?.message || 'Export failed');
            }
          }}
        >
          Export PDF
        </button>
      </div>

      {(canEdit || canDelete) && (
        <div className="actions-bar glass p-4 mb-4">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/pradhikaran/all-received-answers')}>
            View All Received Answers
          </button>
          {canEdit && (
            <>
              {canFinalize && (
                <button type="button" className="btn btn-primary" onClick={() => navigate(`/pradhikaran/finalize/${id}`)}>
                  Finalize Question
                </button>
              )}
            </>
          )}
          {canDelete && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete (Move to Trash)
            </button>
          )}
        </div>
      )}

      {question.status === 'finalized' && question.finalAnswer && (
        <div className="glass p-4 mb-4">
          <h3>Final Answer (Published)</h3>
          <pre className="final-answer">{question.finalAnswer}</pre>
          <p className="meta">
            Published: {question.finalAnswerPublishedAt && new Date(question.finalAnswerPublishedAt).toLocaleString()}
          </p>
        </div>
      )}

      {viewAnswers && (
        <div className="modal-overlay" onClick={() => setViewAnswers(false)}>
          <div className="glass modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>All Received Answers</h2>
              <button type="button" onClick={() => setViewAnswers(false)}>×</button>
            </div>
            <div className="answers-list">
              {answers.length === 0 ? (
                <div className="text-center p-4">No answers received yet.</div>
              ) : (
                answers.map((a) => (
                  <div key={a._id} className="answer-block glass p-4 mb-3">
                    <div className="answer-meta">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{a.department?.departmentName || a.department?.name || a.department}</strong>
                          <div className="text-muted small">
                            Submitted: {new Date(a.createdAt).toLocaleString()} | Version: {a.version}
                          </div>
                        </div>
                        <span className={`badge badge-${a.status}`}>{a.status}</span>
                      </div>
                    </div>
                    
                    <div className="answer-content mt-2">
                      {a.content}
                    </div>
                    
                    {/* Show attachments if any */}
                    {a.attachments && a.attachments.length > 0 && (
                      <div className="attachments-section mt-3">
                        <h5>Attached Documents:</h5>
                        <div className="attachments-list">
                          {a.attachments.map((attachment, idx) => (
                            <div key={idx} className="attachment-item mb-2">
                              <a 
                                href={`/uploads/${attachment.path}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="attachment-link d-block"
                              >
                                📎 {attachment.originalName} ({(attachment.size / 1024).toFixed(2)} KB)
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {a.previousVersions?.length > 0 && (
                      <div className="mt-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => setExpandedVersions((e) => ({ ...e, [a._id]: !e[a._id] }))}
                        >
                          {expandedVersions[a._id] ? 'Hide' : 'Show'} previous versions
                        </button>
                        {expandedVersions[a._id] && (
                          <ul className="previous-versions mt-2">
                            {a.previousVersions.map((v, i) => (
                              <li key={i} className="mb-2">
                                <div className="text-muted small">v{v.version} – {new Date(v.submittedAt).toLocaleString()}</div>
                                <pre className="small-pre bg-light p-2 rounded">{v.content?.slice(0, 200)}...</pre>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    
                    {question.status !== 'finalized' && question.status !== 'locked' && a.status === 'pending_review' && (
                      <div className="answer-actions mt-3">
                        <button
                          type="button"
                          className="btn btn-success btn-sm me-2"
                          onClick={() => setAnswerStatus(a._id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm me-2"
                          onClick={() => setAnswerStatus(a._id, 'rejected')}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn btn-warning btn-sm"
                          onClick={() => {
                            const remark = prompt('Enter reason for update request:');
                            if (remark !== null) {
                              setAnswerStatus(a._id, 'update_requested', remark);
                            }
                          }}
                        >
                          Request Update
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {finalizeOpen && (
        <div className="modal-overlay" onClick={() => setFinalizeOpen(false)}>
          <div className="glass modal-content finalize-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Finalize Question – Final Decision</h2>
              <button type="button" onClick={() => setFinalizeOpen(false)}>×</button>
            </div>
            <p className="text-muted mb-4">Review accepted answers and create the official final answer.</p>
            
            <div className="accepted-copies mb-4">
              <h4>Accepted Answers</h4>
              {acceptedAnswers.map((a) => (
                <div key={a._id} className="glass p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <strong>{a.department?.departmentName || a.department?.name}</strong>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={compileAnswers[a._id] || false}
                        onChange={() => toggleCompileAnswer(a._id)}
                        id={`compile-${a._id}`}
                      />
                      <label className="form-check-label small" htmlFor={`compile-${a._id}`}>
                        Include in final
                      </label>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary mt-2"
                    onClick={() => copyToFinal(a.content)}
                  >
                    Copy Content
                  </button>
                  
                  {a.attachments && a.attachments.length > 0 && (
                    <div className="attachments-preview mt-2">
                      <small>Attachments:</small>
                      <div className="attachments-list small">
                        {a.attachments.map((attachment, idx) => (
                          <div key={idx} className="attachment-item">
                            <a 
                              href={`/uploads/${attachment.path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="attachment-link"
                            >
                              📎 {attachment.originalName}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <pre className="small-pre mt-2 bg-light p-2 rounded">{a.content?.slice(0, 300)}...</pre>
                </div>
              ))}
              
              {acceptedAnswers.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={generateFinalAnswerFromSelected}
                  >
                    Generate from Selected
                  </button>
                </div>
              )}
            </div>
            
            <label>
              Final Answer (Editable)
              <textarea
                value={finalAnswerText}
                onChange={(e) => setFinalAnswerText(e.target.value)}
                rows={12}
                className="form-control mt-2"
                placeholder="Combine and edit content from answers above to create the official final answer..."
              />
            </label>
            
            <div className="form-actions mt-3">
              <button type="button" className="btn btn-secondary" onClick={() => setFinalizeOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={handleFinalize}
              >
                {submitting ? 'Processing...' : 'Confirm Finalization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
