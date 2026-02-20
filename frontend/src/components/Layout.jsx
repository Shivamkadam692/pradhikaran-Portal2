import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isPradhikaran = user?.role === 'PRADHIKARAN';
  const isDepartment = user?.role === 'DEPARTMENT';
  const isSenate = user?.role === 'SENATE';

  return (
    <div className="layout">
      <header className="layout-header glass">
        <button type="button" className="nav-toggle" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
        <NavLink to="/" className="logo">
          <span className="logo-text">Pradhikaran Portal</span>
        </NavLink>
        <nav className={`layout-nav ${navOpen ? 'open' : ''}`}>
          {isDepartment && (
            <>
              <NavLink to="/department" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Dashboard
              </NavLink>
              <NavLink to="/department/history" className={({ isActive }) => (isActive ? 'active' : '')}>
                History
              </NavLink>
            </>
          )}
          {isPradhikaran && (
            <>
              <NavLink to="/pradhikaran" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Dashboard
              </NavLink>
              <NavLink to="/pradhikaran/permissions" className={({ isActive }) => (isActive ? 'active' : '')}>
                Permissions
              </NavLink>
              <NavLink to="/pradhikaran/history" className={({ isActive }) => (isActive ? 'active' : '')}>
                History
              </NavLink>
              <NavLink to="/pradhikaran/senate-inbox" className={({ isActive }) => (isActive ? 'active' : '')}>
                Senate Questions
              </NavLink>
            </>
          )}
          {isSenate && (
            <>
              <NavLink to="/senate" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Dashboard
              </NavLink>
            </>
          )}
          {isSuperAdmin && (
            <>
              <NavLink to="/super-admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Super Admin
              </NavLink>
            </>
          )}
        </nav>
        <div className="header-actions">
          <NotificationDropdown />
          <div className="user-menu">
            <span className="user-name">{user?.name}</span>
            <span className="user-role badge badge-role">{user?.role?.replace('_', ' ')}</span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
