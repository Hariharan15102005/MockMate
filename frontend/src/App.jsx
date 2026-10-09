import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleRoute from './auth/RoleRoute';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Navbar } from './components/Navbar';

// Public Pages
import { Landing } from './pages/Landing';
import { HealthTest } from './pages/HealthTest';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AccessDenied from './pages/common/AccessDenied';
import NotFound from './pages/common/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminEngineers from './pages/admin/Engineers';
import AdminInstructors from './pages/admin/Instructors';
import AdminCandidates from './pages/admin/Candidates';
import AdminInterviews from './pages/admin/Interviews';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminSettings from './pages/admin/Settings';

// Engineer Pages
import EngineerDashboard from './pages/engineer/Dashboard';
import EngineerCandidates from './pages/engineer/Candidates';
import CandidateIntake from './pages/engineer/CandidateIntake';
import PendingVerification from './pages/engineer/PendingVerification';
import EngineerAssignments from './pages/engineer/Assignments';
import SentAssignments from './pages/engineer/SentAssignments';
import PendingAssignments from './pages/engineer/PendingAssignments';
import EngineerInterviews from './pages/engineer/Interviews';
import ScheduledInterviews from './pages/engineer/ScheduledInterviews';
import InProgressInterviews from './pages/engineer/InProgressInterviews';
import CompletedInterviews from './pages/engineer/CompletedInterviews';
import EngineerReports from './pages/engineer/Reports';
import EngineerNotifications from './pages/engineer/Notifications';
import EngineerProfile from './pages/engineer/Profile';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorCandidates from './pages/instructor/Candidates';
import PendingCandidates from './pages/instructor/PendingCandidates';
import InstructorInterviews from './pages/instructor/Interviews';
import InterviewBuilder from './pages/instructor/InterviewBuilder';
import InstructorScheduled from './pages/instructor/ScheduledInterviews';
import InstructorInProgress from './pages/instructor/InProgressInterviews';
import InstructorCompleted from './pages/instructor/CompletedInterviews';
import InstructorReports from './pages/instructor/Reports';
import InstructorAnalytics from './pages/instructor/Analytics';
import InstructorNotifications from './pages/instructor/Notifications';
import InstructorProfile from './pages/instructor/Profile';

// Candidate Pages
import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateInterviews from './pages/candidate/Interviews';
import CandidateUpcoming from './pages/candidate/UpcomingInterviews';
import CandidateCompleted from './pages/candidate/CompletedInterviews';
import CandidateProfile from './pages/candidate/Profile';

export const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Public Pages with Top Navbar */}
          <Route
            path="/"
            element={
              <div className="app-container">
                <Navbar />
                <Landing />
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div className="app-container">
                <Navbar />
                <Login />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="app-container">
                <Navbar />
                <Register />
              </div>
            }
          />
          <Route
            path="/health-test"
            element={
              <div className="app-container">
                <Navbar />
                <HealthTest />
              </div>
            }
          />
          <Route
            path="/access-denied"
            element={
              <div className="app-container">
                <Navbar />
                <AccessDenied />
              </div>
            }
          />

          {/* ==========================================================
              ADMIN PROTECTED ROUTES
             ========================================================== */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="engineers" element={<AdminEngineers />} />
                      <Route path="instructors" element={<AdminInstructors />} />
                      <Route path="candidates" element={<AdminCandidates />} />
                      <Route path="interviews" element={<AdminInterviews />} />
                      <Route path="audit-logs" element={<AdminAuditLogs />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* ==========================================================
              INTERVIEW ENGINEER PROTECTED ROUTES
             ========================================================== */}
          <Route
            path="/engineer/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['INTERVIEW_ENGINEER']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<EngineerDashboard />} />
                      <Route path="candidates" element={<EngineerCandidates />} />
                      <Route path="candidates/intake" element={<CandidateIntake />} />
                      <Route path="candidates/pending" element={<PendingVerification />} />
                      <Route path="assignments" element={<EngineerAssignments />} />
                      <Route path="assignments/sent" element={<SentAssignments />} />
                      <Route path="assignments/pending" element={<PendingAssignments />} />
                      <Route path="interviews" element={<EngineerInterviews />} />
                      <Route path="interviews/scheduled" element={<ScheduledInterviews />} />
                      <Route path="interviews/in-progress" element={<InProgressInterviews />} />
                      <Route path="interviews/completed" element={<CompletedInterviews />} />
                      <Route path="reports" element={<EngineerReports />} />
                      <Route path="notifications" element={<EngineerNotifications />} />
                      <Route path="profile" element={<EngineerProfile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* ==========================================================
              INSTRUCTOR PROTECTED ROUTES
             ========================================================== */}
          <Route
            path="/instructor/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['INSTRUCTOR']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<InstructorDashboard />} />
                      <Route path="candidates" element={<InstructorCandidates />} />
                      <Route path="candidates/pending" element={<PendingCandidates />} />
                      <Route path="interviews" element={<InstructorInterviews />} />
                      <Route path="interviews/builder" element={<InterviewBuilder />} />
                      <Route path="interviews/scheduled" element={<InstructorScheduled />} />
                      <Route path="interviews/in-progress" element={<InstructorInProgress />} />
                      <Route path="interviews/completed" element={<InstructorCompleted />} />
                      <Route path="reports" element={<InstructorReports />} />
                      <Route path="analytics" element={<InstructorAnalytics />} />
                      <Route path="notifications" element={<InstructorNotifications />} />
                      <Route path="profile" element={<InstructorProfile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* ==========================================================
              CANDIDATE PROTECTED ROUTES
             ========================================================== */}
          <Route
            path="/candidate/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['CANDIDATE']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<CandidateDashboard />} />
                      <Route path="interviews" element={<CandidateInterviews />} />
                      <Route path="interviews/upcoming" element={<CandidateUpcoming />} />
                      <Route path="interviews/completed" element={<CandidateCompleted />} />
                      <Route path="profile" element={<CandidateProfile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              <div className="app-container">
                <Navbar />
                <NotFound />
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
