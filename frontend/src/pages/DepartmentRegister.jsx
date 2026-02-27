import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DepartmentSelect from '../components/DepartmentSelect';
import { DEPARTMENT_OPTIONS } from '../constants/departments';
import api from '../api/client';
import './Auth.css';

export default function DepartmentRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState(DEPARTMENT_OPTIONS);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });

    // Fetch public dynamic departments
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/auth/departments');
        const customDepts = res.data.data
          .map(d => (d.departmentName || d.name || '').trim())
          .filter(Boolean);
        const uniqueCustomDepts = [...new Set(customDepts)];

        // Merge standard options with dynamic custom departments, ensuring 'Other' remains at the end
        const baseOptions = DEPARTMENT_OPTIONS.filter(opt => opt !== 'Other');
        const dynamicMerged = [...new Set([...baseOptions, ...uniqueCustomDepts])];
        setDepartmentOptions([...dynamicMerged, 'Other']);
      } catch (err) {
        console.error('Failed to load dynamic departments:', err);
      }
    };

    if (!isAuthenticated) {
      fetchDepartments();
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDepartmentError('');
    if (!departmentName || departmentName.trim() === '') {
      setDepartmentError('Please select a department');
      return;
    }
    if (departmentName === 'Other' && (!customDepartment || customDepartment.trim() === '')) {
      setDepartmentError('Please enter a department name');
      return;
    }
    const finalDepartment = departmentName === 'Other' ? customDepartment.trim() : departmentName;
    setLoading(true);
    try {
      await register(name, email, password, finalDepartment);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card glass card-hover">
          <Link to="/auth" className="auth-back">← Back to role selection</Link>
          <h1 className="auth-title">Registration submitted</h1>
          <p className="auth-subtitle">You can sign in after your account is approved by a Pradhikaran administrator.</p>
          <Link to="/auth/department/login" className="btn btn-primary">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass card-hover">
        <Link to="/auth" className="auth-back">← Back to role selection</Link>
        <h1 className="auth-title">Department Registration</h1>
        <p className="auth-subtitle">Register to participate. Your account must be approved by a Pradhikaran administrator before you can sign in.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error" role="alert">{error}</div>}
          <label htmlFor="dept-reg-name">
            Name
            <input
              id="dept-reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
              autoFocus
            />
          </label>
          <label htmlFor="dept-reg-email">
            Email
            <input
              id="dept-reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <div className="auth-form-field">
            <DepartmentSelect
              id="dept-reg-dept"
              label="Department"
              value={departmentName}
              onChange={(val) => {
                setDepartmentName(val);
                setDepartmentError('');
              }}
              required
              error={departmentError}
              options={departmentOptions}
            />
          </div>
          {departmentName === 'Other' && (
            <label htmlFor="dept-reg-custom">
              Specify Department
              <input
                id="dept-reg-custom"
                type="text"
                value={customDepartment}
                onChange={(e) => {
                  setCustomDepartment(e.target.value);
                  setDepartmentError('');
                }}
                placeholder="Enter department name"
                required
              />
            </label>
          )}
          <label htmlFor="dept-reg-password">
            Password
            <input
              id="dept-reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Register'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/auth/department/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
