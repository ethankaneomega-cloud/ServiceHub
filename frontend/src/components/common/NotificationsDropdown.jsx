import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, Calendar } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TYPE_COLORS = {
  accepted: 'bg-emerald-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-400',
  new_job: 'bg-amber-500',
  new_worker: 'bg-purple-500',
  pending: 'bg-amber-400',
};

const DROPDOWN_MARGIN = 12;
const MAX_DROPDOWN_WIDTH = 360;

const NotificationsDropdown = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const updateDropdownPosition = () => {
    const trigger = buttonRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(MAX_DROPDOWN_WIDTH, window.innerWidth - DROPDOWN_MARGIN * 2);
    const left = Math.min(
      Math.max(rect.right - width, DROPDOWN_MARGIN),
      window.innerWidth - width - DROPDOWN_MARGIN
    );

    setDropdownStyle({
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      left: `${left}px`,
      width: `${width}px`,
    });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      const clickedButton = wrapperRef.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);
      if (!clickedButton && !clickedDropdown) setOpen(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (notif) => {
    markRead(notif.id);
    setOpen(false);
    if (user?.role === 'worker') navigate('/worker/bookings');
    else if (user?.role === 'user') navigate('/my-bookings');
    else navigate(notif.type === 'new_worker' ? '/admin/workers' : '/admin/bookings');
  };

  const timeAgo = (dateStr) => {
    const time = new Date(dateStr).getTime();
    if (Number.isNaN(time)) return '';

    const diff = Date.now() - time;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap"
            type="button"
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <Bell size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.read ? 'bg-blue-50/40' : ''}`}
              type="button"
            >
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_COLORS[notif.type] || 'bg-gray-400'}`} />
              <span className="flex-1 min-w-0">
                <span className={`block text-sm leading-5 break-words ${notif.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {notif.message}
                </span>
                <span className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Calendar size={10} /> {timeAgo(notif.time)}
                </span>
              </span>
              {!notif.read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-blue-800 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
        type="button"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(dropdown, document.body)}
    </div>
  );
};

export default NotificationsDropdown;
