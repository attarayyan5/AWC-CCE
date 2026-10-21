import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Menu, User, LogOut, Key, ChevronDown } from 'lucide-react';

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border h-16 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-secondary-text" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-primary-text">{title}</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary-blue-light flex items-center justify-center">
            <User className="w-4 h-4 text-primary-blue" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-primary-text">{user?.email?.split('@')[0]}</p>
            <p className="text-xs text-secondary-text">{user?.role}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-secondary-text hidden sm:block" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl border border-border shadow-lg py-1 z-40">
            <button
              onClick={() => { setDropdownOpen(false); navigate(user?.role === 'ADMIN' ? '/admin/settings' : '/member/profile'); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary-text hover:bg-gray-50"
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary-text hover:bg-gray-50"
            >
              <Key className="w-4 h-4" /> Change Password
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
