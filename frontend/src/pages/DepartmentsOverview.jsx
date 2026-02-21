import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './Dashboard.css';

export default function DepartmentsOverview() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answersByDept, setAnswersByDept] = useState({});
  const [expanded, setExpanded] = useState({});

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
          <div key={d._id} className="glass card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h4>{d.departmentName || d.name || 'Department'}</h4>
                <p className="text-muted">{d.email}</p>
                <span className="badge badge-open">{d.isApproved ? 'Approved' : 'Pending'}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => toggleExpand(d._id)}
              >
                {expanded[d._id] ? 'Hide' : 'Show'} answered questions
              </button>
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
                        {answersByDept[d._id].questions.map((q) => (
                          <li key={q._id} className="mb-1">
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
