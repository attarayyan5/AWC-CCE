import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../utils/constants.js';
import Button from '../components/ui/Button.jsx';

export default function AccessDeniedPage() {
  const { user } = useAuth();

  const dashboardPath = user?.role === ROLES.ADMIN ? '/admin/dashboard' : '/member/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Access Denied</h2>
        <p className="text-gray-500 mb-8">
          You don&apos;t have permission to access this page. If you believe this is an error,
          please contact your administrator.
        </p>
        <Link to={dashboardPath}>
          <Button variant="primary" size="lg">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
