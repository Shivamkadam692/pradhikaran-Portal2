import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import './QuestionDetail.css';
import './AnswerPages.css';

export default function FinalizeQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [finalAnswerText, setFinalAnswerText] = useState('');
  const [compileAnswers, setCompileAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          api.get(`/questions/${id}`),
          api.get(`/questions/${id}/answers`).catch(() => ({ data: { data: [] } })),
        ]);
        const q = qRes.data.data;
        const ans = aRes.data.data || [];
        setQuestion(q);
        setAnswers(ans);
        const accepted = ans.filter(a => a.status === 'accepted');
        const initialCompileState = {};
        accepted.forEach(a => { initialCompileState[a._id] = true; });
        setCompileAnswers(initialCompileState);
        const compiledText = accepted.map(a => a.content).join('\n\n---\n\n');
        setFinalAnswerText(compiledText);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const copyToFinal = (text) => {
    setFinalAnswerText(prev => (prev ? prev + '\n\n---\n\n' + text : text));
  };

  const toggleCompileAnswer = (answerId) => {
    setCompileAnswers(prev => ({ ...prev, [answerId]: !prev[answerId] }));
  };

  const generateFinalAnswerFromSelected = () => {
    const selectedAnswers = answers.filter(a => a.status === 'accepted' && compileAnswers[a._id]);
    const compiledText = selectedAnswers.map(a => a.content).join('\n\n---\n\n');
    setFinalAnswerText(compiledText);
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/questions/${id}/finalize`, { finalAnswer: finalAnswerText });
      navigate(`/pradhikaran/question/${id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to finalize');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="glass p-4">Loading...</div>;
  if (!question) return <div className="glass p-4">Question not found.</div>;

  const acceptedAnswers = answers.filter(a => a.status === 'accepted');

  return (
    <div className="question-detail">
      <div className="glass p-4 mb-4">
        <button type="button" className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Finalize Question – Final Decision</h1>
        <p className="description">{question.title}</p>
        <span className={`badge badge-${question.status}`}>{question.status}</span>
      </div>

      {error && <div className="auth-error mb-4">{error}</div>}

      <div className="glass p-4 mb-4">
        <h3>Accepted Answers ({acceptedAnswers.length})</h3>
        {acceptedAnswers.length === 0 ? (
          <div>No accepted answers yet.</div>
        ) : (
          <div className="answers-list">
            {acceptedAnswers.map((a) => (
              <div key={a._id} className="answer-block mb-3">
                <div className="answer-meta">
                  <div className="d-flex justify-content-between align-items-start">
                    <strong>{a.department?.departmentName || a.department?.name || a.department}</strong>
                    <div>
                      <input
                        type="checkbox"
                        checked={compileAnswers[a._id] || false}
                        onChange={() => toggleCompileAnswer(a._id)}
                        id={`compile-${a._id}`}
                      />
                      <label className="small ml-2" htmlFor={`compile-${a._id}`}>Include in final</label>
                    </div>
                  </div>
                </div>
                <div className="answer-content">{a.content}</div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mt-2"
                  onClick={() => copyToFinal(a.content)}
                >
                  Copy Content
                </button>
              </div>
            ))}
          </div>
        )}
        {acceptedAnswers.length > 0 && (
          <div className="mt-2">
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

      <div className="glass p-4 mb-4">
        <h3>Final Answer (Editable)</h3>
        <textarea
          value={finalAnswerText}
          onChange={(e) => setFinalAnswerText(e.target.value)}
          rows={12}
          className="form-control mt-2"
          placeholder="Combine and edit content from answers above to create the official final answer..."
        />
        <div className="form-actions mt-3">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary ml-2"
            disabled={submitting}
            onClick={handleFinalize}
          >
            {submitting ? 'Processing...' : 'Confirm Finalization'}
          </button>
        </div>
      </div>
    </div>
  );
}

