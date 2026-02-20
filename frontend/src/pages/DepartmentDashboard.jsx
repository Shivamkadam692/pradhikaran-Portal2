import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import History from './History';
import './Dashboard.css';

function DepartmentHome() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api
      .get('/questions')
      .then((res) => setQuestions(res.data.data))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass p-4">Loading...</div>;

  const exportMyPdf = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/export/department/${user._id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department-${user._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Assigned Questions</h2>
        <button type="button" className="btn btn-secondary" onClick={exportMyPdf}>
          Export my PDF
        </button>
      </div>
      <p className="text-muted mb-4">Click a question to view details and submit your answer.</p>
      <div className="card-grid">
        {questions.map((q) => (
          <div
            key={q._id}
            className="glass card card-hover"
            onClick={() => navigate(`/question/${q._id}`)}
          >
            <h4>{q.title}</h4>
            <p className="text-muted">{q.description?.slice(0, 120)}...</p>
            <span className={`badge badge-${q.status}`}>{q.status}</span>
          </div>
        ))}
      </div>
      {questions.length === 0 && (
        <p className="text-muted">No questions assigned to you yet.</p>
      )}
    </div>
  );
}

export default function DepartmentDashboard() {
  return (
    <Routes>
      <Route index element={<DepartmentHome />} />
      <Route path="history" element={<History />} />
    </Routes>
  );
}
