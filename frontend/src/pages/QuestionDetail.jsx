import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import './QuestionDetail.css';
import RichTextEditor from '../components/RichTextEditor';

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

function StatusBanner({ answer }) {
  if (!answer) return null;
  if (answer.status === 'update_requested') {
    return (
      <div className="status-banner update-requested">
        ✏️ Update requested — please revise your answer and resubmit.
      </div>
    );
  }
  if (answer.status === 'pending_review') {
    return (
      <div className="status-banner pending">
        🔵 Your answer is under review.
      </div>
    );
  }
  if (answer.status === 'accepted') {
    return (
      <div className="status-banner accepted">
        ✅ Your answer was accepted.
      </div>
    );
  }
  return null;
}

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      const qRes = await api.get(`/questions/${id}`);
      setQuestion(qRes.data.data);
      api.get(`/answers/question/${id}`)
        .then(res => {
          setAnswer(res.data.data);
          setContent(res.data.data?.content || '');
          if (res.data.data?.attachments) {
            setPreviewFiles(res.data.data.attachments);
          }
        })
        .catch(() => setAnswer(null));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  /* ── File handling ── */
  const addFiles = (selected) => {
    const arr = Array.from(selected);
    setFiles(prev => [...prev, ...arr]);
    const previews = arr.map(f => ({
      originalName: f.name,
      mimeType: f.type,
      size: f.size,
      fileUrl: URL.createObjectURL(f),
      isNew: true,
    }));
    setPreviewFiles(prev => [...prev, ...previews]);
  };

  const handleFileChange = (e) => addFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    const pf = previewFiles[index];
    if (pf.isNew) {
      // count how many new files come before this index
      const newCount = previewFiles.slice(0, index).filter(f => f.isNew).length;
      setFiles(prev => prev.filter((_, i) => i !== newCount));
    }
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('questionId', id);
      formData.append('content', content);
      files.forEach(f => formData.append('attachments', f));
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (answer) {
        await api.put(`/answers/${answer._id}`, formData, opts);
      } else {
        await api.post('/answers', formData, opts);
      }
      setEditing(false);
      setFiles([]);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = question?.status === 'open' && (!answer || answer.status === 'update_requested');
  const isFinalized = question?.status === 'finalized';

  if (loading) return <div className="glass p-4">Loading…</div>;
  if (!question) return <div className="glass p-4">Question not found.</div>;

  return (
    <div className="question-detail">
      <button type="button" className="btn btn-secondary mb-4" onClick={() => navigate('/department')}>
        ← Back
      </button>
      {error && <div className="auth-error mb-4">{error}</div>}

      {/* Question info card */}
      <div className="glass p-4 mb-4">
        <h1>{question.title}</h1>
        <p className="description">{question.description}</p>
        <div className="q-info-strip">
          <div className="q-info-item">
            Status: <span className={`badge badge-${question.status}`}>{question.status}</span>
          </div>
          {question.priority && (
            <div className="q-info-item">
              Priority: <span className={`badge badge-${question.priority}`}>{PRIORITY_LABELS[question.priority]}</span>
            </div>
          )}
          {question.deadline && (
            <div className="q-info-item"><DeadlineChip deadline={question.deadline} /></div>
          )}
          {question.createdBy && (
            <div className="q-info-item">
              👤 <strong>{question.createdBy.name || question.createdBy.email}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Finalized answer (read-only for department) */}
      {isFinalized && (
        <div className="glass p-4 mb-4" style={{ borderLeft: '4px solid var(--indigo)' }}>
          <h3>✅ Final Answer Published</h3>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            This question has been finalized. The official answer is below.
          </p>
        </div>
      )}

      {/* Answer submission section */}
      <div className="glass p-4 mb-4">
        <h3>Your Submission</h3>

        <StatusBanner answer={answer} />

        {!answer && !editing && canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
            Submit Answer
          </button>
        )}

        {answer && !editing && (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className={`badge badge-${answer.status}`}>{answer.status.replace('_', ' ')}</span>
              <span className="meta">Version {answer.version}</span>
            </div>
            <div className="answer-content" dangerouslySetInnerHTML={{ __html: answer.content || '' }} />

            {answer.attachments && answer.attachments.length > 0 && (
              <div className="attachments-section mt-3">
                <h4>Attached Files:</h4>
                <div className="attachments-list">
                  {answer.attachments.map((att, i) => (
                    <div key={i} className="attachment-item">
                      <a href={`/uploads/${att.path}`} target="_blank" rel="noopener noreferrer" className="attachment-link">
                        📎 {att.originalName} ({(att.size / 1024).toFixed(2)} KB)
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canEdit && (
              <button type="button" className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setEditing(true)}>
                ✏️ Update Answer
              </button>
            )}
          </>
        )}

        {editing && (
          <form onSubmit={handleSubmit}>
            <RichTextEditor
              value={content}
              onChange={setContent}
              disabled={!canEdit}
              placeholder="Write your answer here…"
            />

            {/* Drag-drop upload zone */}
            <div
              className={`upload-zone mt-3${dragOver ? ' dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <span className="upload-zone-icon">📁</span>
              <strong>Drag & drop files here</strong>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                or <u>click to browse</u> — PDF, Word, Excel, images (max 10 MB each)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                disabled={!canEdit}
              />
            </div>

            {previewFiles.length > 0 && (
              <div className="attachments-section mt-3">
                <h4>Files to attach:</h4>
                <div className="attachments-list">
                  {previewFiles.map((file, index) => (
                    <div key={index} className="attachment-item">
                      <span className="attachment-info">
                        📎 {file.originalName} ({(file.size / 1024).toFixed(2)} KB)
                        {file.isNew && <span style={{ marginLeft: '0.4rem', color: 'var(--indigo)', fontSize: '0.75rem' }}>NEW</span>}
                      </span>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); setFiles([]); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !canEdit}>
                {submitting ? 'Saving…' : (answer ? 'Update' : 'Submit') + ' Answer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
