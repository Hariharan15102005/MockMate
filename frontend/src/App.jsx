import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleRoute from './auth/RoleRoute';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { HealthTest } from './pages/HealthTest';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AccessDenied from './pages/common/AccessDenied';
import AdminDashboard from './pages/admin/AdminDashboard';
import EngineerDashboard from './pages/engineer/EngineerDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CandidateDashboard from './pages/candidate/CandidateDashboard';

export const App = () => {
  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/health-test" element={<HealthTest />} />

          {/* Role-Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/engineer/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['INTERVIEW_ENGINEER']}>
                  <EngineerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['CANDIDATE']}>
                  <CandidateDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;
