import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user?.role === 'SUPER_ADMIN') navigate('/super-admin', { replace: true });
    else if (user?.role === 'PRADHIKARAN') navigate('/pradhikaran', { replace: true });
    else if (user?.role === 'DEPARTMENT') navigate('/department', { replace: true });
    else if (user?.role === 'SENATE') navigate('/senate', { replace: true });
    else if (user?.role === 'AUDITOR') navigate('/auditor', { replace: true });
    else navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
      Redirecting...
    </div>
  );
}
