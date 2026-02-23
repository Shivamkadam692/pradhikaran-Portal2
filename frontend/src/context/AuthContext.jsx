import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setAccessToken, getAccessToken } from '../api/client';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      return data.data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state on app startup
  const initializeAuth = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Try to validate existing token by calling /auth/me
      await refreshUser();
    } catch (error) {
      // If token is expired, try to refresh it
      if (error.response?.status === 401) {
        try {
          const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
          const newToken = data.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            await refreshUser();
          } else {
            setAccessToken(null);
            setUser(null);
            setLoading(false);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens
          setAccessToken(null);
          setUser(null);
          setLoading(false);
        }
      } else {
        // Other error, clear auth state
        setAccessToken(null);
        setUser(null);
        setLoading(false);
      }
    }
  }, [refreshUser]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data;
  }, []);

  const register = useCallback(async (name, email, password, departmentName) => {
    await api.post('/auth/register', { name, email, password, departmentName });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      try {
        localStorage.removeItem('super_admin_access');
      } catch {}
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isPradhikaran: user?.role === 'PRADHIKARAN',
    isDepartment: user?.role === 'DEPARTMENT',
    isSenate: user?.role === 'SENATE',
    isAuditor: user?.role === 'AUDITOR',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
