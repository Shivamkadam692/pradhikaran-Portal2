import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RoleSelect.css';

const PradhikaranIcon = () => (
  <svg className="role-card__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
  </svg>
);

const DepartmentIcon = () => (
  <svg className="role-card__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SenateIcon = () => (
  <svg className="role-card__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="3" />
    <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
  </svg>
);

export default function RoleSelect() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="auth-page" role="status" aria-live="polite">
        <p className="auth-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="auth-page role-select-page">
      <div className="role-select__wrap">
        <header className="role-select__header">
          <h1 className="role-select__title">Pradhikaran Portal</h1>
          <p className="role-select__subtitle">Select your role to continue</p>
        </header>

        <div className="role-select__grid" role="list">
          <Link
            to="/auth/pradhikaran/login"
            className="role-card"
            role="listitem"
            aria-label="Continue as Pradhikaran (Governing Authority)"
          >
            <span className="role-card__icon-wrap role-card__icon-wrap--pradhikaran">
              <PradhikaranIcon />
            </span>
            <h2 className="role-card__title">Pradhikaran</h2>
            <p className="role-card__desc">Governing Authority. Create questions, review answers, and finalize decisions. Account created by Super Admin.</p>
            <span className="role-card__cta">Sign in →</span>
          </Link>

          <Link
            to="/auth/department/login"
            className="role-card"
            role="listitem"
            aria-label="Continue as Department (Contributor)"
          >
            <span className="role-card__icon-wrap role-card__icon-wrap--department">
              <DepartmentIcon />
            </span>
            <h2 className="role-card__title">Department</h2>
            <p className="role-card__desc">Contributor. Submit answers to assigned questions. Register for an account; login after approval.</p>
            <span className="role-card__cta">Sign in or Register →</span>
          </Link>

          <Link
            to="/auth/senate/login"
            className="role-card"
            role="listitem"
            aria-label="Continue as Senate (Question Initiator)"
          >
            <span className="role-card__icon-wrap role-card__icon-wrap--pradhikaran">
              <SenateIcon />
            </span>
            <h2 className="role-card__title">Senate</h2>
            <p className="role-card__desc">Initiate questions to Pradhikaran and departments. Credentials are created by Super Admin only.</p>
            <span className="role-card__cta">Sign in →</span>
          </Link>
        </div>

        <p className="role-select__admin-hint">
          Super Admin access is via secure URL only.
        </p>
      </div>
    </div>
  );
}
