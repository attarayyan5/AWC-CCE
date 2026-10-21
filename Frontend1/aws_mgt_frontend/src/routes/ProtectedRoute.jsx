import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
    </div>
  );
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
