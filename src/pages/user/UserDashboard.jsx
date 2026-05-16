import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatCard, StatusBadge, ServiceLabel, Spinner } from '../../components/common/UI';
import { Calendar, CheckCircle, Clock, XCircle, ArrowRight, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/bookings/my-bookings?limit=5');
        setBookings(data.bookings);
      } catch {
        toast.error('Failed to load bookings.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const counts = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name}! 👋</h1>
        <p className="page-subtitle">Here's an overview of your bookings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Bookings" value={counts.total} icon={Calendar} color="blue" />
        <StatCard label="Pending" value={counts.pending} icon={Clock} color="amber" />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle} color="green" />
        <StatCard label="Cancelled" value={counts.cancelled} icon={XCircle} color="red" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link to="/services" className="card p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Book a Service</h3>
              <p className="text-sm text-gray-500 mt-0.5">Browse and book home services</p>
            </div>
            <ArrowRight size={20} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link to="/my-bookings" className="card p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">View All Bookings</h3>
              <p className="text-sm text-gray-500 mt-0.5">Track your service requests</p>
            </div>
            <ArrowRight size={20} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link to="/reports" className="card p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Submit a Report</h3>
              <p className="text-sm text-gray-500 mt-0.5">Report booking, safety, or app concerns</p>
            </div>
            <Flag size={20} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link to="/my-bookings" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No bookings yet.</p>
            <Link to="/services" className="btn-primary mt-4 inline-flex">Browse Services</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.map((booking) => (
              <div key={booking._id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      <ServiceLabel type={booking.serviceType} />
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Worker: {booking.workerId?.userId?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(booking.scheduleDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} at {booking.scheduleTime}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
