import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import './Dashboard.css';

export default function DepartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDepartmentDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load all departments first
      const deptRes = await api.get('/users/departments');
      const allDepartments = Array.isArray(deptRes.data.data) ? deptRes.data.data : [];
      
      // Find the specific department by ID
      const foundDepartment = allDepartments.find(dept => dept._id === id);
      
      if (!foundDepartment) {
        setError(`Department with ID ${id} not found`);
        setLoading(false);
        return;
      }
      
      setDepartment(foundDepartment);
      
      // Load department's answered questions
      const answersRes = await api.get(`/answers/department/${id}`);
      const answers = Array.isArray(answersRes.data.data) ? answersRes.data.data : [];
      
      // Extract unique questions from answers
      const uniqueQuestions = [];
      const seen = new Set();
      
      for (const answer of answers) {
        if (answer.question && answer.question._id && !seen.has(answer.question._id)) {
          seen.add(answer.question._id);
          uniqueQuestions.push({
            ...answer.question,
            answerStatus: answer.status,
            answerDate: answer.updatedAt,
            answerId: answer._id
          });
        }
      }
      
      setQuestions(uniqueQuestions);
    } catch (e) {
      console.error('Error loading department details:', e);
      setError(e.response?.data?.message || e.message || 'Failed to load department details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDepartmentDetails();
    } else {
      setError('No department ID provided');
      setLoading(false);
    }
  }, [id]);

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

  const exportDepartmentPdf = async () => {
    try {
      const res = await api.get(`/export/department/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department-${department?.name || 'department'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.response?.data?.message || 'Export failed');
    }
  };

  if (loading) return <div className="glass p-4">Loading department details...</div>;
  
  if (error) return (
    <div className="glass p-4">
      <div className="auth-error">{error}</div>
      <button 
        type="button" 
        className="btn btn-secondary mt-3"
        onClick={() => navigate('/pradhikaran/departments')}
      >
        ← Back to Departments
      </button>
    </div>
  );

  if (!department) return (
    <div className="glass p-4">
      <div className="auth-error">Department not found</div>
      <button 
        type="button" 
        className="btn btn-secondary mt-3"
        onClick={() => navigate('/pradhikaran/departments')}
      >
        ← Back to Departments
      </button>
    </div>
  );

  return (
    <div className="dashboard-section">
      <div className="header-actions mb-4">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => navigate('/pradhikaran/departments')}
        >
          ← Back to Departments
        </button>
      </div>

      <div className="glass p-4 mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1 className="mb-3">{department.departmentName || department.name || 'Department'}</h1>
            <div className="department-info">
              <p className="mb-2"><strong>Email:</strong> {department.email}</p>
              <p className="mb-2">
                <strong>Status:</strong> 
                <span className={`badge ${department.isApproved ? 'badge-success' : 'badge-warning'} ms-2`}>
                  {department.isApproved ? 'Approved' : 'Pending Approval'}
                </span>
              </p>
              {department.createdAt && (
                <p className="mb-2"><strong>Registered:</strong> {formatDate(department.createdAt)}</p>
              )}
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={exportDepartmentPdf}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="glass p-4">
        <h2 className="mb-4">Answered Questions ({questions.length})</h2>
        
        {questions.length === 0 ? (
          <div className="text-muted">No answered questions found for this department.</div>
        ) : (
          <div className="questions-list">
            {questions.map((question, idx) => (
              <div key={question._id} className="question-item glass p-3 mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center">
                    <span className="question-index me-2">Q{idx + 1}</span>
                    <h4 className="mb-0">{question.title}</h4>
                  </div>
                  <div className="d-flex gap-2">
                    <span className={`badge badge-${question.status}`}>{question.status}</span>
                    <span className={`badge ${getStatusBadgeClass(question.answerStatus)}`}>
                      Answer: {question.answerStatus?.replace('_', ' ')?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <p className="text-muted mb-2">{question.description}</p>
                
                {question.answerDate && (
                  <div className="answer-meta text-muted small">
                    <span>Last updated: {formatDate(question.answerDate)}</span>
                  </div>
                )}
                
                <div className="question-actions mt-3">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/pradhikaran/question/${question._id}`)}
                  >
                    View Question Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}