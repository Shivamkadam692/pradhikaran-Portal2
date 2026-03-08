import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './Dashboard.css';

export default function DepartmentsOverview() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answersByDept, setAnswersByDept] = useState({});
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();

  const loadDepartments = async () => {
    try {
      const dRes = await api.get('/users/departments');
      setDepartments(Array.isArray(dRes.data.data) ? dRes.data.data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const toggleExpand = async (deptId) => {
    setExpanded((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
    if (!answersByDept[deptId]) {
      try {
        const res = await api.get(`/answers/department/${deptId}`);
        const answers = Array.isArray(res.data.data) ? res.data.data : [];
        const questions = [];
        const seen = new Set();
        for (const a of answers) {
          if (a.question && a.question._id && !seen.has(a.question._id)) {
            seen.add(a.question._id);
            questions.push(a.question);
          }
        }
        setAnswersByDept((prev) => ({ ...prev, [deptId]: { answers, questions } }));
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load answers');
      }
    }
  };

  if (loading) return <div className="glass p-4">Loading departments...</div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Departments and Answered Questions</h2>
      </div>
      {error && <div className="auth-error mb-2">{error}</div>}
      <div className="card-grid">
        {departments.map((d) => (
          <div key={d._id} className="glass card card-hover" style={{ cursor: 'pointer' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div onClick={() => navigate(`/pradhikaran/departments/${d._id}`)}>
                <h4>
                  {d.departmentName || d.name || 'Department'}
                  {d.subDepartmentName && ` - ${d.subDepartmentName}`}
                </h4>
                <p className="text-muted">{d.email}</p>
                <span className="badge badge-open">{d.isApproved ? 'Approved' : 'Pending'}</span>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(d._id);
                  }}
                >
                  {expanded[d._id] ? 'Hide' : 'Show'} answered questions
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/pradhikaran/departments/${d._id}`);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
            {expanded[d._id] && (
              <div className="mt-3">
                {!answersByDept[d._id] ? (
                  <div className="text-muted">Loading...</div>
                ) : (
                  <>
                    <h5>Questions</h5>
                    {answersByDept[d._id].questions.length === 0 ? (
                      <div className="text-muted">No answered questions.</div>
                    ) : (
                      <ul className="list-unstyled">
                        {answersByDept[d._id].questions.map((q, idx) => (
                          <li key={q._id} className="mb-1">
                            <span className="question-index">Q{idx + 1}</span>
                            <strong>{q.title}</strong> <span className={`badge badge-${q.status}`}>{q.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {departments.length === 0 && <p className="text-muted">No departments found.</p>}
    </div>
  );
}
