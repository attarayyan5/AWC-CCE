import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { X, LayoutDashboard, Users, Calendar, ClipboardList, BarChart3, FileText, FolderOpen, Shield, Settings, Home, Clock } from 'lucide-react';

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/members', icon: Users, label: 'Members' },
  { to: '/admin/activities', icon: Calendar, label: 'Activities' },
  { to: '/admin/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/reports', icon: FileText, label: 'Reports' },
  { to: '/admin/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const memberLinks = [
  { to: '/member/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/member/activities', icon: Calendar, label: 'Activities' },
  { to: '/member/attendance', icon: ClipboardList, label: 'My Attendance' },
  { to: '/member/cca-hours', icon: Clock, label: 'CCA Hours' },
  { to: '/member/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/member/profile', icon: Users, label: 'Profile' },
];

export default function MobileNav({ isOpen, onClose }) {
  const { user } = useAuth();
  const links = user?.role === 'ADMIN' ? adminLinks : memberLinks;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-blue flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-primary-text text-lg">AWS Club</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close menu">
            <X className="w-5 h-5 text-secondary-text" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {links.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'bg-primary-blue-light text-primary-blue' : 'text-secondary-text hover:bg-gray-50 hover:text-primary-text'}`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
