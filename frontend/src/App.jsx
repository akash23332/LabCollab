import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Teammate's landing page
import Landing from './pages/public/Landing';

// Auth pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Admin panel (existing, untouched)
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Equipment from './pages/admin/Equipment';
import Availability from './pages/admin/Availability';
import BookingRequests from './pages/admin/BookingRequests';
import UsageLogs from './pages/admin/UsageLogs';
import Analytics from './pages/admin/Analytics';

// Student / User portal
import UserLayout from './layouts/UserLayout';
import UserDashboard from './pages/user/Dashboard';
import FindEquipment from './pages/user/FindEquipment';
import AISearch from './pages/user/AISearch';

function StudentDashboardWrapper() {
  const { activeTab } = useAuth();

  switch (activeTab) {
    case 'explore':
      return (
        <UserLayout>
          <FindEquipment />
        </UserLayout>
      );
    case 'ai-search':
      return (
        <UserLayout>
          <AISearch />
        </UserLayout>
      );
    case 'overview':
    default:
      return (
        <UserLayout>
          <UserDashboard />
        </UserLayout>
      );
  }
}

function LogoutHandler() {
  const { logout } = useAuth();
  useEffect(() => {
    logout();
  }, [logout]);
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/logout" element={<LogoutHandler />} />

          {/* Protected User Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboardWrapper />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="availability" element={<Availability />} />
            <Route path="booking-requests" element={<BookingRequests />} />
            <Route path="usage-logs" element={<UsageLogs />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
