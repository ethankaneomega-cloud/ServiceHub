import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const STORAGE_PREFIX = 'sh_read_notifs';

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getReadIds = useCallback(() => getStoredReadIds(user), [user]);

  // Generate in-app notifications from bookings and role-specific activity.
  const generateNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      let items = [];

      if (user.role === 'user') {
        const { data } = await api.get('/bookings/my-bookings?limit=20');
        const bookings = Array.isArray(data.bookings) ? data.bookings : [];

        items = bookings
          .filter(b => ['accepted', 'completed', 'cancelled'].includes(b.status))
          .map(b => ({
            id: `user-booking-${b._id}-${b.status}`,
            bookingId: b._id,
            type: b.status,
            message: buildUserMessage(b),
            time: b.updatedAt || b.createdAt,
            read: isRead(user, `user-booking-${b._id}-${b.status}`),
          }));
      } else if (user.role === 'worker') {
        const { data } = await api.get('/bookings/worker-bookings?limit=20');
        const bookings = Array.isArray(data.bookings) ? data.bookings : [];

        items = bookings
          .filter(b => ['pending', 'cancelled'].includes(b.status))
          .map(b => {
            const id = `worker-booking-${b._id}-${b.status}`;
            return {
              id,
              bookingId: b._id,
              type: b.status === 'pending' ? 'new_job' : 'cancelled',
              message: buildWorkerMessage(b),
              time: b.status === 'pending' ? b.createdAt : b.updatedAt || b.createdAt,
              read: isRead(user, id),
            };
          });
      } else if (user.role === 'admin') {
        const [bookingResponse, workerResponse] = await Promise.all([
          api.get('/admin/bookings?limit=20'),
          api.get('/admin/workers?status=pending&limit=20'),
        ]);

        const bookings = Array.isArray(bookingResponse.data.bookings) ? bookingResponse.data.bookings : [];
        const workers = Array.isArray(workerResponse.data.workers) ? workerResponse.data.workers : [];

        const bookingNotifications = bookings
          .filter(b => b.status === 'pending')
          .map(b => {
            const id = `admin-booking-${b._id}-${b.status}`;
            return {
              id,
              bookingId: b._id,
              type: 'pending',
              message: buildAdminBookingMessage(b),
              time: b.createdAt,
              read: isRead(user, id),
            };
          });

        const workerNotifications = workers.map(w => {
          const id = `admin-worker-${w._id}-${w.status}`;
          return {
            id,
            workerId: w._id,
            type: 'new_worker',
            message: buildAdminWorkerMessage(w),
            time: w.createdAt,
            read: isRead(user, id),
          };
        });

        items = [...bookingNotifications, ...workerNotifications];
      }

      items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length);
    } catch {
      // Keep notifications non-blocking so the dashboard still loads if one request fails.
    }
  }, [user]);

  useEffect(() => {
    generateNotifications();
    const interval = setInterval(generateNotifications, 30000);
    return () => clearInterval(interval);
  }, [generateNotifications]);

  const markRead = (id) => {
    if (!user) return;

    const stored = getReadIds();
    if (!stored.includes(id)) {
      localStorage.setItem(getStorageKey(user), JSON.stringify([...stored, id]));
    }

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    if (!user) return;

    const stored = getReadIds();
    const ids = notifications.map(n => n.id);
    localStorage.setItem(getStorageKey(user), JSON.stringify([...new Set([...stored, ...ids])]));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, refresh: generateNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

function getStorageKey(user) {
  const userKey = user?._id || user?.email || 'guest';
  const roleKey = user?.role || 'unknown';
  return `${STORAGE_PREFIX}_${roleKey}_${userKey}`;
}

function getStoredReadIds(user) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getStorageKey(user)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isRead(user, id) {
  return getStoredReadIds(user).includes(id);
}

function formatService(serviceType) {
  return String(serviceType || 'service').replace(/_/g, ' ');
}

function getWorkerName(booking) {
  return booking.workerId?.userId?.name || 'the worker';
}

function getClientName(booking) {
  return booking.userId?.name || 'a client';
}

function buildUserMessage(booking) {
  const service = formatService(booking.serviceType);
  const worker = getWorkerName(booking);

  switch (booking.status) {
    case 'accepted': return `Your ${service} booking was accepted by ${worker}.`;
    case 'completed': return `Your ${service} booking has been completed!`;
    case 'cancelled': return `Your ${service} booking was cancelled.`;
    default: return `Your ${service} booking status was updated to ${booking.status}.`;
  }
}

function buildWorkerMessage(booking) {
  const service = formatService(booking.serviceType);
  const client = getClientName(booking);

  if (booking.status === 'cancelled') return `${client} cancelled the ${service} booking.`;
  return `New job request: ${service} from ${client}.`;
}

function buildAdminBookingMessage(booking) {
  const service = formatService(booking.serviceType);
  const client = getClientName(booking);
  const worker = getWorkerName(booking);
  return `New pending ${service} booking from ${client} for ${worker}.`;
}

function buildAdminWorkerMessage(worker) {
  const applicant = worker.userId?.name || 'A worker';
  const service = formatService(worker.serviceType);
  return `New worker application: ${applicant} for ${service}.`;
}
