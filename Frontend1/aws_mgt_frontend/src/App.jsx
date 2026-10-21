import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Spinner from './components/ui/Spinner.jsx';

import PublicRoute from './routes/PublicRoute.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';

import AuthLayout from './layouts/AuthLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import MemberLayout from './layouts/MemberLayout.jsx';

import { ROLES } from './utils/constants.js';

// Public pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'));

// Admin pages
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const MembersPage = lazy(() => import('./pages/admin/MembersPage.jsx'));
const MemberNewPage = lazy(() => import('./pages/admin/MemberNewPage.jsx'));
const MemberDetailPage = lazy(() => import('./pages/admin/MemberDetailPage.jsx'));

const ActivitiesPage = lazy(() => import('./pages/admin/ActivitiesPage.jsx'));
const ActivityNewPage = lazy(() => import('./pages/admin/ActivityNewPage.jsx'));
const ActivityEditPage = lazy(() => import('./pages/admin/ActivityEditPage.jsx'));

const AttendancePage = lazy(() => import('./pages/admin/AttendancePage.jsx'));

// Attendance upload pages
// const AttendanceUploadPage = lazy(() => import('./pages/admin/AttendanceUploadPage.jsx'));
// const AttendanceImportDetailPage = lazy(() => import('./pages/admin/AttendanceImportDetailPage.jsx'));

// Other admin pages
// const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage.jsx'));
// const ReportsPage = lazy(() => import('./pages/admin/ReportsPage.jsx'));
// const DocumentsPage = lazy(() => import('./pages/admin/DocumentsPage.jsx'));
// const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage.jsx'));
// const SettingsPage = lazy(() => import('./pages/admin/SettingsPage.jsx'));

// Member pages
// const MemberDashboardPage = lazy(() => import('./pages/member/MemberDashboardPage.jsx'));
// const MemberActivitiesPage = lazy(() => import('./pages/member/MemberActivitiesPage.jsx'));
// const MemberAttendancePage = lazy(() => import('./pages/member/MemberAttendancePage.jsx'));
// const MemberCcaHoursPage = lazy(() => import('./pages/member/MemberCcaHoursPage.jsx'));
// const MemberDocumentsPage = lazy(() => import('./pages/member/MemberDocumentsPage.jsx'));
// const MemberProfilePage = lazy(() => import('./pages/member/MemberProfilePage.jsx'));

// Standalone pages
const AccessDeniedPage = lazy(() => import('./pages/AccessDeniedPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />

              <Route path="/admin/members" element={<MembersPage />} />
              <Route path="/admin/members/new" element={<MemberNewPage />} />
              <Route path="/admin/members/:id" element={<MemberDetailPage />} />

              <Route path="/admin/activities" element={<ActivitiesPage />} />
              <Route path="/admin/activities/new" element={<ActivityNewPage />} />
              <Route path="/admin/activities/:id/edit" element={<ActivityEditPage />} />

              <Route path="/admin/attendance" element={<AttendancePage />} />

              {/*
              <Route
                path="/admin/attendance/upload"
                element={<AttendanceUploadPage />}
              />

              <Route
                path="/admin/attendance/imports/:id"
                element={<AttendanceImportDetailPage />}
              />

              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/documents" element={<DocumentsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              */}
            </Route>
          </Route>
        </Route>

        {/* Member routes */}
        {/*
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={[ROLES.MEMBER]} />}>
            <Route element={<MemberLayout />}>
              <Route
                path="/member/dashboard"
                element={<MemberDashboardPage />}
              />

              <Route
                path="/member/activities"
                element={<MemberActivitiesPage />}
              />

              <Route
                path="/member/attendance"
                element={<MemberAttendancePage />}
              />

              <Route
                path="/member/cca-hours"
                element={<MemberCcaHoursPage />}
              />

              <Route
                path="/member/documents"
                element={<MemberDocumentsPage />}
              />

              <Route
                path="/member/profile"
                element={<MemberProfilePage />}
              />
            </Route>
          </Route>
        </Route>
        */}

        {/* Access denied */}
        <Route
          path="/access-denied"
          element={<AccessDeniedPage />}
        />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}