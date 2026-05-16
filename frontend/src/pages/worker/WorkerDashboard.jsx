import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatCard, StatusBadge, ServiceLabel, Spinner } from '../../components/common/UI';
import { ClipboardList, CheckCircle, Clock, AlertCircle, ArrowRight, Flag, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkerDashboard = () => {
  const { user, workerProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workerProfile?.isApproved) {
      api.get('/bookings/worker-bookings?limit=5').then(({ data }) => {
        setBookings(data.bookings);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [workerProfile]);

  const counts = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  if (!workerProfile?.isApproved) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Worker Dashboard</h1>
        </div>
        <div className="card p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Application Under Review</h2>
          <p className="text-gray-500 mt-2">
            Your worker application is currently being reviewed by our admin team. You'll be able to accept jobs once approved.
          </p>
          <div className="mt-4 inline-flex">
            <StatusBadge status={workerProfile?.status || 'pending'} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name}! 👷</h1>
        <p className="page-subtitle">Here's your job overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Jobs" value={counts.total} icon={ClipboardList} color="blue" />
        <StatCard label="Pending" value={counts.pending} icon={Clock} color="amber" />
        <StatCard label="Accepted" value={counts.accepted} icon={AlertCircle} color="purple" />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle} color="green" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link to="/worker/bookings" className="card p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Manage Jobs</h3>
              <p className="text-sm text-gray-500 mt-0.5">Accept, start, and complete requests</p>
            </div>
            <ArrowRight size={20} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link to="/worker/reports" className="card p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Submit a Report</h3>
              <p className="text-sm text-gray-500 mt-0.5">Report client, safety, or app concerns</p>
            </div>
            <Flag size={20} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link to="/worker/analytics" className="card p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-500 mt-0.5">Track earnings, bookings, ratings, and performance</p>
            </div>
            <BarChart3 size={20} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Job Requests</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No job requests yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.map((booking) => (
              <div key={booking._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900"><ServiceLabel type={booking.serviceType} /></p>
                    <p className="text-sm text-gray-500">Client: {booking.userId?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(booking.scheduleDate).toLocaleDateString('en-PH')} at {booking.scheduleTime}
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

export default WorkerDashboard;
