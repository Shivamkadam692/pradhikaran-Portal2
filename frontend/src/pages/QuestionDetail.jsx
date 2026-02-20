import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import './QuestionDetail.css';
import RichTextEditor from '../components/RichTextEditor';

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

  const load = async () => {
    try {
      const qRes = await api.get(`/questions/${id}`);
      setQuestion(qRes.data.data);
      api
        .get(`/answers/question/${id}`)
        .then((res) => {
          setAnswer(res.data.data);
          setContent(res.data.data?.content || '');
          // Set existing attachments if any
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

  useEffect(() => {
    load();
  }, [id]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    // Create preview URLs for the selected files
    const newPreviews = selectedFiles.map(file => ({
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      fileUrl: URL.createObjectURL(file),
      isNew: true // Mark as new file to distinguish from existing attachments
    }));
    
    setPreviewFiles(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index, isNew) => {
    if (isNew) {
      // Remove from new files
      setFiles(prev => prev.filter((_, i) => i !== index));
      setPreviewFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from existing attachments
      setPreviewFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('questionId', id);
      formData.append('content', content);

      // Append files to form data
      files.forEach(file => {
        formData.append('attachments', file);
      });

      let response;
      if (answer) {
        // Update existing answer
        response = await api.put(`/answers/${answer._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Create new answer
        response = await api.post('/answers', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setEditing(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = question?.status === 'open' && (!answer || answer.status === 'update_requested');
  const isFinalized = question?.status === 'finalized';

  if (loading) return <div className="glass p-4">Loading...</div>;
  if (!question) return <div className="glass p-4">Question not found.</div>;

  return (
    <div className="question-detail">
      <button type="button" className="btn btn-secondary mb-4" onClick={() => navigate('/department')}>
        ← Back
      </button>
      {error && <div className="auth-error mb-4">{error}</div>}

      <div className="glass p-4 mb-4">
        <h1>{question.title}</h1>
        <p className="description">{question.description}</p>
        <span className={`badge badge-${question.status}`}>{question.status}</span>
      </div>


      <div className="glass p-4 mb-4">
        <h3>Your Submission</h3>
        {!answer && !editing && canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
            Submit Answer
          </button>
        )}
        {answer && !editing && (
          <>
            <span className={`badge badge-${answer.status}`}>{answer.status}</span>
            <span className="meta">Version {answer.version}</span>
            <div className="answer-content" dangerouslySetInnerHTML={{ __html: answer.content || '' }} />
            {answer.attachments && answer.attachments.length > 0 && (
              <div className="attachments-section">
                <h4>Attached Files:</h4>
                <div className="attachments-list">
                  {answer.attachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <a 
                        href={`/uploads/${attachment.path}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        📎 {attachment.originalName} ({(attachment.size / 1024).toFixed(2)} KB)
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {canEdit && (
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
                Update (requested)
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
              placeholder="Write your answer here..."
            />
            
            {/* File Upload Section */}
            <div className="file-upload-section mt-3">
              <label className="file-upload-label">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                  disabled={!canEdit}
                />
                <span className="btn btn-outline">Choose Files to Attach</span>
              </label>
              <small className="text-muted d-block mt-1">
                Support: Images, PDF, Word, Excel, PowerPoint, Text files (Max 10MB each, up to 5 files)
              </small>
            </div>
            
            {/* Preview Selected Files */}
            {previewFiles.length > 0 && (
              <div className="attachments-preview mt-3">
                <h4>Attached Files:</h4>
                <div className="attachments-list">
                  {previewFiles.map((file, index) => (
                    <div key={index} className="attachment-item">
                      <span className="attachment-info">
                        📎 {file.originalName} ({file.isNew ? (file.size / 1024).toFixed(2) + ' KB' : (file.size / 1024).toFixed(2) + ' KB'})
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger ml-2"
                        onClick={() => removeFile(index, file.isNew)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !canEdit}>
                {answer ? 'Update' : 'Submit'} Answer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
