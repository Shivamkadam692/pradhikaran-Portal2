import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import './QuestionDetail.css';

export default function SenateQuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [finalData, setFinalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(false);

  const load = async () => {
    try {
      const qRes = await api.get(`/questions/${id}`);
      setQuestion(qRes.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const loadFinalAnswer = async () => {
    if (!question || question.status !== 'finalized') return;
    setViewing(true);
    try {
      const res = await api.get(`/questions/${id}/final-answer`);
      setFinalData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load final answer');
    } finally {
      setViewing(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (question && question.status === 'finalized') {
      loadFinalAnswer();
    }
  }, [question?.status]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!question) return <div className="p-4">Question not found.</div>;

  const isFinalized = question.status === 'finalized';

  return (
    <div className="question-detail question-detail--fullpage">
      <button type="button" className="btn btn-secondary mb-4" onClick={() => navigate('/senate')}>
        ← Back
      </button>
      {error && <div className="auth-error mb-4">{error}</div>}

      <section className="vertical-section">
        <h1 className="vertical-title">{question.title}</h1>
        <p className="vertical-description">{question.description}</p>
        <div className="vertical-meta">
          <span className={`badge badge-${question.status}`}>{question.status}</span>
        </div>
      </section>

      {isFinalized && (
        <section className="vertical-section">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="vertical-subtitle">Official Final Answer</h3>
            <button
              type="button"
              className="btn btn-primary"
              onClick={loadFinalAnswer}
              disabled={viewing}
            >
              {viewing ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {finalData ? (
            <>
              <pre className="final-answer">{finalData.finalAnswer}</pre>
              <p className="meta">
                Published: {finalData.finalAnswerPublishedAt && new Date(finalData.finalAnswerPublishedAt).toLocaleString()}
              </p>
            </>
          ) : (
            <div className="text-muted">Final answer not available.</div>
          )}
        </section>
      )}
    </div>
  );
}
