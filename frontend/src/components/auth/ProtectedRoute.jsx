import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Authenticated student trying to access admin route redirects to /dashboard
    if (requiredRole === 'admin' && role === 'student') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
