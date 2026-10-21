import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ChevronLeft, ChevronRight, LayoutDashboard, Users, Calendar, ClipboardList, BarChart3, FileText, FolderOpen, Shield, Settings, Home, Clock, FileCheck } from 'lucide-react';
import { useState } from 'react';

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

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const links = user?.role === 'ADMIN' ? adminLinks : memberLinks;

  return (
    <aside className={`hidden lg:flex flex-col bg-white border-r border-border h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-blue flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        {!collapsed && <span className="font-bold text-primary-text text-lg">AWS Club</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-primary-blue-light text-primary-blue'
                    : 'text-secondary-text hover:bg-gray-50 hover:text-primary-text'
                  }`
                }
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-secondary-text hover:bg-gray-50"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
