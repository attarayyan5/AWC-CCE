import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

export default function PublicRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
    </div>
  );
  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard'} replace />;
  }
  return <Outlet />;
}
