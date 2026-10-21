import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import MobileNav from '../components/layout/MobileNav.jsx';

const pageTitles = {
  '/member/dashboard': 'My Dashboard',
  '/member/activities': 'Activities',
  '/member/attendance': 'My Attendance',
  '/member/cca-hours': 'CCA Hours',
  '/member/documents': 'Documents',
  '/member/profile': 'Profile',
};

export default function MemberLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'Member';

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
