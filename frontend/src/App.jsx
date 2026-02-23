import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import RoleSelect from './pages/RoleSelect';
import PradhikaranLogin from './pages/PradhikaranLogin';
import DepartmentLogin from './pages/DepartmentLogin';
import DepartmentRegister from './pages/DepartmentRegister';
import Dashboard from './pages/Dashboard';
import PradhikaranDashboard from './pages/PradhikaranDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import QuestionDetail from './pages/QuestionDetail';
import PradhikaranQuestionDetail from './pages/PradhikaranQuestionDetail';
import ViewAllAnswers from './pages/ViewAllAnswers';
import AllReceivedAnswers from './pages/AllReceivedAnswers';
import CompileAnswer from './pages/CompileAnswer';
import FinalizeQuestion from './pages/FinalizeQuestion';
import SenateLogin from './pages/SenateLogin';
import SenateDashboard from './pages/SenateDashboard';
import SenateQuestionDetail from './pages/SenateQuestionDetail';
import AuditorLogin from './pages/AuditorLogin';
import AuditorDashboard from './pages/AuditorDashboard';

function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="loading-screen" role="status" aria-live="polite">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/auth" element={<RoleSelect />} />
      <Route path="/auth/pradhikaran/login" element={<PradhikaranLogin />} />
      <Route path="/auth/department/login" element={<DepartmentLogin />} />
      <Route path="/auth/department/register" element={<DepartmentRegister />} />
      <Route path="/auth/senate/login" element={<SenateLogin />} />
      <Route path="/auth/auditor/login" element={<AuditorLogin />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth" replace />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pradhikaran/question/:id" element={
          <PrivateRoute allowedRoles={['PRADHIKARAN']}>
            <PradhikaranQuestionDetail />
          </PrivateRoute>
        } />
        <Route path="pradhikaran/compile/:id" element={
          <PrivateRoute allowedRoles={['PRADHIKARAN']}>
            <CompileAnswer />
          </PrivateRoute>
        } />
        <Route path="pradhikaran/finalize/:id" element={
          <PrivateRoute allowedRoles={['PRADHIKARAN']}>
            <FinalizeQuestion />
          </PrivateRoute>
        } />
        <Route path="pradhikaran/view-all-answers" element={
          <PrivateRoute allowedRoles={['PRADHIKARAN', 'SUPER_ADMIN']}>
            <ViewAllAnswers />
          </PrivateRoute>
        } />
        <Route path="pradhikaran/all-received-answers" element={
          <PrivateRoute allowedRoles={['PRADHIKARAN', 'SUPER_ADMIN']}>
            <AllReceivedAnswers />
          </PrivateRoute>
        } />
        <Route
          path="pradhikaran/*"
          element={
            <PrivateRoute allowedRoles={['PRADHIKARAN']}>
              <PradhikaranDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="department/*"
          element={
            <PrivateRoute allowedRoles={['DEPARTMENT']}>
              <DepartmentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="senate/*"
          element={
            <PrivateRoute allowedRoles={['SENATE']}>
              <SenateDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="auditor/*"
          element={
            <PrivateRoute allowedRoles={['AUDITOR']}>
              <AuditorDashboard />
            </PrivateRoute>
          }
        />
        <Route path="senate/question/:id" element={
          <PrivateRoute allowedRoles={['SENATE']}>
            <SenateQuestionDetail />
          </PrivateRoute>
        } />
        <Route
          path="super-admin/*"
          element={
            <PrivateRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </PrivateRoute>
          }
        />
        <Route path="question/:id" element={<QuestionDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
