import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './AnswerPages.css';

export default function ViewAllAnswers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load all questions for the logged-in user
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        let response;
        
        if (user?.role === 'PRADHIKARAN') {
          // Get questions created by this pradhikaran user
          response = await api.get('/questions/mine');
        } else if (user?.role === 'SUPER_ADMIN') {
          // Get all questions for super admin
          response = await api.get('/questions/all');
        } else {
          throw new Error('Insufficient permissions');
        }
        
        setQuestions(response.data.data);
        
        // If there are questions, load answers for the first one by default
        if (response.data.data && response.data.data.length > 0) {
          const firstQuestion = response.data.data[0];
          setSelectedQuestion(firstQuestion);
          await loadAnswers(firstQuestion._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'PRADHIKARAN' || user?.role === 'SUPER_ADMIN') {
      loadQuestions();
    } else {
      setError('You do not have permission to view all answers');
      setLoading(false);
    }
  }, [user]);

  const loadAnswers = async (questionId) => {
    try {
      const response = await api.get(`/questions/${questionId}/answers`);
      setAnswers(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load answers');
      setAnswers([]);
    }
  };

  const handleQuestionChange = async (e) => {
    const questionId = e.target.value;
    const question = questions.find(q => q._id === questionId);
    setSelectedQuestion(question);
    await loadAnswers(questionId);
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

  if (loading) return <div className="glass p-4">Loading questions and answers...</div>;
  if (error) return <div className="glass p-4"><div className="auth-error">{error}</div></div>;

  return (
    <div className="view-all-answers">
      <div className="header-actions mb-4">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>

      <h1 className="page-title">View All Answers</h1>

      {questions.length === 0 ? (
        <div className="glass p-4">No questions found.</div>
      ) : (
        <div className="row">
          <div className="col-md-4">
            <div className="glass p-3 mb-4">
              <label htmlFor="question-select" className="form-label">Select Question:</label>
              <select
                id="question-select"
                className="form-control"
                value={selectedQuestion?._id || ''}
                onChange={handleQuestionChange}
              >
                {questions.map((question, idx) => (
                  <option key={question._id} value={question._id}>
                    Q{idx + 1}: {question.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedQuestion && (
              <div className="glass p-3">
                <h3>Question Details</h3>
                <div className="mb-2">
                  <strong>Title:</strong> <span className="question-index">Q{questions.findIndex(q => q._id === selectedQuestion._id) + 1}</span> {selectedQuestion.title}
                </div>
                <div className="mb-2">
                  <strong>Description:</strong> {selectedQuestion.description}
                </div>
                <div className="mb-2">
                  <strong>Status:</strong> <span className={`badge badge-${selectedQuestion.status}`}>{selectedQuestion.status}</span>
                </div>
                <div className="mb-2">
                  <strong>Created:</strong> {formatDate(selectedQuestion.createdAt)}
                </div>
              </div>
            )}
          </div>

          <div className="col-md-8">
            <div className="glass p-3">
              <h3>Answers ({answers.length})</h3>
              
              {answers.length === 0 ? (
                <div>No answers for this question yet.</div>
              ) : (
                <div className="answers-list">
                  {answers.map((answer) => (
                    <div key={answer._id} className="answer-block mb-3">
                      <div className="answer-meta">
                        <div className="department-info">
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
                      
                      {answer.remark && (
                        <div className="answer-remark mt-2">
                          <small><strong>Remark:</strong> {answer.remark}</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}