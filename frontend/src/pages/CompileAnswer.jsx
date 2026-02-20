import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './AnswerPages.css';

export default function CompileAnswer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          api.get(`/questions/${id}`),
          api.get(`/questions/${id}/answers`).catch(() => ({ data: { data: [] } })),
        ]);

        setQuestion(qRes.data.data);
        setAnswers(aRes.data.data || []);

        // Pre-populate final answer with accepted answers
        const acceptedAnswers = aRes.data.data?.filter(a => a.status === 'accepted') || [];
        const compiledText = acceptedAnswers.map(a => a.content).join('\n\n---\n\n');
        setFinalAnswer(compiledText);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleAcceptAnswer = (answerId) => {
    setAnswers(prevAnswers =>
      prevAnswers.map(answer =>
        answer._id === answerId
          ? { ...answer, status: 'accepted' }
          : answer
      )
    );

    // Update final answer with accepted content
    const answer = answers.find(a => a._id === answerId);
    if (answer && !finalAnswer.includes(answer.content)) {
      setFinalAnswer(prev => prev ? prev + '\n\n---\n\n' + answer.content : answer.content);
    }
  };

  const handleRejectAnswer = async (answerId) => {
    try {
      await api.post(`/answers/${answerId}/status`, { status: 'rejected' });
      
      setAnswers(prevAnswers =>
        prevAnswers.map(answer =>
          answer._id === answerId
            ? { ...answer, status: 'rejected' }
            : answer
        )
      );
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reject answer');
    }
  };

  const handleRequestUpdate = async (answerId, remark = '') => {
    try {
      await api.post(`/answers/${answerId}/status`, { status: 'update_requested', remark });
      
      setAnswers(prevAnswers =>
        prevAnswers.map(answer =>
          answer._id === answerId
            ? { ...answer, status: 'update_requested' }
            : answer
        )
      );
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to request update');
    }
  };

  const handleLockQuestion = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // First finalize the question with the compiled answer
      if (finalAnswer.trim()) {
        await api.post(`/questions/${id}/finalize`, { finalAnswer: finalAnswer.trim() });
      }

      // Then lock the question
      await api.post(`/questions/${id}/lock`);

      navigate('/pradhikaran');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to lock question');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'accepted': return 'badge-success';
      case 'rejected': return 'badge-error';
      case 'update_requested': return 'badge-warning';
      case 'pending_review': return 'badge-info';
      default: return 'badge-default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div className="glass p-4">Loading...</div>;
  if (!question) return <div className="glass p-4">Question not found.</div>;

  const canEdit = question.status === 'open';
  const acceptedAnswers = answers.filter(a => a.status === 'accepted');
  const pendingAnswers = answers.filter(a => a.status === 'pending_review');

  return (
    <div className="compile-answer">
      <div className="header-actions mb-4">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>

      {error && <div className="auth-error mb-4">{error}</div>}

      <div className="glass p-4 mb-4">
        <h1>{question.title}</h1>
        <p className="description">{question.description}</p>
        <span className={`badge badge-${question.status}`}>{question.status}</span>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="glass p-4 mb-4">
            <h3>Pending Answers ({pendingAnswers.length})</h3>
            
            {pendingAnswers.length === 0 ? (
              <div>No pending answers to review.</div>
            ) : (
              <div className="answers-list">
                {pendingAnswers.map((answer) => (
                  <div key={answer._id} className="answer-block">
                    <div className="answer-meta">
                      <div>
                        <strong>{answer.department?.name || 'Unknown Department'}</strong>
                        {answer.department?.departmentName && (
                          <small className="text-muted"> ({answer.department.departmentName})</small>
                        )}
                      </div>
                      <span className={`badge ${getStatusBadgeClass(answer.status)}`}>
                        {answer.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <small className="text-muted">{formatDate(answer.updatedAt)}</small>
                    </div>
                    
                    <div className="answer-content">
                      {answer.content}
                    </div>
                    
                    {canEdit && (
                      <div className="answer-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => handleAcceptAnswer(answer._id)}
                          disabled={!canEdit}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          onClick={() => {
                            const remark = prompt('Enter reason for update request:');
                            if (remark !== null) {
                              handleRequestUpdate(answer._id, remark);
                            }
                          }}
                          disabled={!canEdit}
                        >
                          Request Update
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to reject this answer?')) {
                              handleRejectAnswer(answer._id);
                            }
                          }}
                          disabled={!canEdit}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="glass p-4 mb-4">
            <h3>Accepted Answers ({acceptedAnswers.length})</h3>
            
            {acceptedAnswers.length === 0 ? (
              <div>No accepted answers yet.</div>
            ) : (
              <div className="answers-list">
                {acceptedAnswers.map((answer) => (
                  <div key={answer._id} className="answer-block">
                    <div className="answer-meta">
                      <div>
                        <strong>{answer.department?.name || 'Unknown Department'}</strong>
                        {answer.department?.departmentName && (
                          <small className="text-muted"> ({answer.department.departmentName})</small>
                        )}
                      </div>
                      <span className={`badge ${getStatusBadgeClass(answer.status)}`}>
                        {answer.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <small className="text-muted">{formatDate(answer.updatedAt)}</small>
                    </div>
                    
                    <div className="answer-content">
                      {answer.content}
                    </div>
                    
                    <div className="answer-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-warning"
                        onClick={() => {
                          const remark = prompt('Enter reason for update request:');
                          if (remark !== null) {
                            handleRequestUpdate(answer._id, remark);
                          }
                        }}
                        disabled={!canEdit}
                      >
                        Request Update
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to reject this answer?')) {
                            handleRejectAnswer(answer._id);
                          }
                        }}
                        disabled={!canEdit}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass p-4 mb-4">
        <h3>Final Answer Preview</h3>
        <textarea
          className="form-control"
          rows="10"
          value={finalAnswer}
          onChange={(e) => setFinalAnswer(e.target.value)}
          placeholder="Compiled final answer will appear here..."
        />
        <div className="mt-2">
          <small className="text-muted">Edit the compiled answer as needed before locking the question.</small>
        </div>
      </div>

      <div className="actions">
        {showConfirmation && (
          <div className="confirmation-modal">
            <div className="modal-content glass p-4">
              <h4>Confirm Lock Question</h4>
              <p>Are you sure you want to lock this question? This will prevent further answers and finalize the question.</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmation(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleLockQuestion}
                  disabled={submitting}
                >
                  {submitting ? 'Locking...' : 'Confirm Lock'}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleLockQuestion}
          disabled={submitting || !canEdit}
        >
          {submitting ? 'Processing...' : showConfirmation ? 'Confirm Lock' : 'Prepare to Lock Question'}
        </button>
      </div>
    </div>
  );
}