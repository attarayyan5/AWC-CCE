import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import MobileNav from '../components/layout/MobileNav.jsx';

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/members': 'Members',
  '/admin/members/new': 'Register Member',
  '/admin/activities': 'Activities',
  '/admin/activities/new': 'Create Activity',
  '/admin/attendance': 'Attendance',
  '/admin/attendance/upload': 'Upload Attendance',
  '/admin/analytics': 'Analytics',
  '/admin/reports': 'Reports',
  '/admin/documents': 'Documents',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'Admin';

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
