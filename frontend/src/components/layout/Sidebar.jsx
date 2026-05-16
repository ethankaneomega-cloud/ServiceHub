import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Calendar, Users, Settings, LogOut, Wrench,
  ClipboardList, BarChart3, UserCheck, Menu, X, Flag
} from 'lucide-react';
import { useState } from 'react';
import NotificationsDropdown from '../common/NotificationsDropdown';
import { getUploadUrl } from '../../services/api';

const navItems = {
  user: [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/services', icon: Wrench, label: 'Services' },
    { to: '/workers', icon: Users, label: 'Find Workers' },
    { to: '/my-bookings', icon: Calendar, label: 'My Bookings' },
    { to: '/reports', icon: Flag, label: 'Reports' },
  ],
  worker: [
    { to: '/worker', icon: Home, label: 'Dashboard' },
    { to: '/worker/bookings', icon: ClipboardList, label: 'My Jobs' },
    { to: '/worker/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/worker/reports', icon: Flag, label: 'Reports' },
    { to: '/worker/profile', icon: Settings, label: 'Profile' },
  ],
  admin: [
    { to: '/admin', icon: BarChart3, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/workers', icon: UserCheck, label: 'Workers' },
    { to: '/admin/bookings', icon: ClipboardList, label: 'Bookings' },
    { to: '/admin/services', icon: Wrench, label: 'Services' },
    { to: '/admin/reports', icon: Flag, label: 'Reports' },
  ],
};

const ROLE_COLORS = {
  admin: 'bg-red-500',
  worker: 'bg-amber-500',
  user: 'bg-emerald-500',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItems[user?.role] || [];
  const profilePictureUrl = getUploadUrl(user?.profilePicture);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-400 rounded-xl flex items-center justify-center">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">ServiceHub</span>
          </div>
          <NotificationsDropdown />
        </div>
      </div>

      <div className="px-4 py-4 border-b border-blue-800/60">
        <div className="flex items-center gap-3">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-blue-700 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-blue-300 text-xs truncate">{user?.email}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-semibold mt-0.5 inline-block ${ROLE_COLORS[user?.role] || 'bg-gray-500'}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/worker' || to === '/admin'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-blue-800/60 space-y-0.5">
        <NavLink
          to={user?.role === 'worker' ? '/worker/profile' : '/profile'}
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
          onClick={() => setMobileOpen(false)}
        >
          <Settings size={17} />
          <span>Profile</span>
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link sidebar-link-inactive w-full text-red-300 hover:text-red-200 hover:bg-red-900/30">
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-900 rounded-xl text-white shadow-lg" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-blue-950 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
      <aside className="hidden lg:flex flex-col w-64 bg-blue-950 min-h-screen flex-shrink-0 shadow-xl">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
