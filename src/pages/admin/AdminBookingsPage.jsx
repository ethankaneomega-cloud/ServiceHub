import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { StatusBadge, ServiceLabel, EmptyState, Spinner } from '../../components/common/UI';
import { Search, Calendar, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchBookings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/admin/bookings?${params}`);
      setBookings(data.bookings);
      setPagination({ page: data.currentPage || 1, pages: data.pages || 1, total: data.total || 0 });
    } catch {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchBookings(1); }, [fetchBookings]);

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const user = b.userId?.name?.toLowerCase() || '';
    const worker = b.workerId?.userId?.name?.toLowerCase() || '';
    return user.includes(search.toLowerCase()) || worker.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Booking Management</h1>
        <p className="page-subtitle">Monitor all service bookings across the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Search by user or worker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {loading ? '' : `${pagination.total} booking${pagination.total !== 1 ? 's' : ''} total`}
      </p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No bookings found" description="No bookings match the selected filters." />
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => (
            <div key={booking._id} className="card overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpanded(expanded === booking._id ? null : booking._id)}
              >
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        <ServiceLabel type={booking.serviceType} />
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>
                        <span className="text-gray-400">Client: </span>
                        <span className="font-medium text-gray-700">{booking.userId?.name || 'N/A'}</span>
                      </span>
                      <span>
                        <span className="text-gray-400">Worker: </span>
                        <span className="font-medium text-gray-700">{booking.workerId?.userId?.name || 'N/A'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(booking.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {booking.price && (
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">₱{booking.price.toLocaleString()}/hr</p>
                    )}
                  </div>
                </div>
              </div>

              {expanded === booking._id && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                  <div className="bg-slate-50 rounded-xl p-4 mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2 text-gray-600">
                      <Calendar size={15} className="mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Schedule</p>
                        <p className="font-medium">{new Date(booking.scheduleDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-gray-500">{booking.scheduleTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin size={15} className="mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Address</p>
                        <p className="font-medium">{booking.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <Clock size={15} className="mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Booking ID</p>
                        <p className="font-mono text-xs">{booking._id}</p>
                        {booking.completedAt && (
                          <p className="text-xs text-emerald-600 mt-1">Completed: {new Date(booking.completedAt).toLocaleDateString('en-PH')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {booking.description && (
                    <p className="text-sm text-gray-600 mt-3 px-1">{booking.description}</p>
                  )}
                  {booking.cancelReason && (
                    <p className="text-sm text-red-500 mt-3 px-1">
                      <span className="font-medium">Cancel reason:</span> {booking.cancelReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button onClick={() => fetchBookings(pagination.page - 1)} disabled={pagination.page === 1} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
          <span className="px-4 py-2 text-gray-600">Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => fetchBookings(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
