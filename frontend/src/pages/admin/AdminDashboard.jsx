import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatCard, StatusBadge, ServiceLabel, Spinner } from '../../components/common/UI';
import { Users, UserCheck, ClipboardList, Clock, AlertTriangle, ArrowRight, Wrench, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => {
      setStats(data.stats);
      setRecentBookings(data.recentBookings);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load stats.');
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System overview and management.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="blue" />
        <StatCard label="Total Workers" value={stats?.totalWorkers || 0} icon={UserCheck} color="green" />
        <StatCard label="Total Bookings" value={stats?.totalBookings || 0} icon={ClipboardList} color="purple" />
        <StatCard label="Active Services" value={stats?.totalServices || 0} icon={Wrench} color="blue" />
        <StatCard label="Pending Workers" value={stats?.pendingWorkers || 0} icon={Clock} color="amber" />
        <StatCard label="Open Reports" value={stats?.openReports || 0} icon={Flag} color="red" />
      </div>

      {/* Alerts */}
      {stats?.pendingWorkers > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-600" />
            <p className="text-amber-800 font-medium">
              {stats.pendingWorkers} worker application{stats.pendingWorkers > 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <Link to="/admin/workers" className="text-amber-700 font-medium text-sm hover:underline flex items-center gap-1">
            Review <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { to: '/admin/users', label: 'Manage Users', desc: 'View and manage all registered users', icon: Users },
          { to: '/admin/workers', label: 'Manage Workers', desc: 'Approve or reject worker applications', icon: UserCheck },
          { to: '/admin/bookings', label: 'Manage Bookings', desc: 'View and monitor all bookings', icon: ClipboardList },
          { to: '/admin/services', label: 'Manage Services', desc: 'Create, edit, deactivate, or delete services', icon: Wrench },
          { to: '/admin/reports', label: 'Manage Reports', desc: 'Review user and worker reports', icon: Flag },
        ].map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to} className="card p-5 hover:shadow-card-hover transition-all duration-200 group hover:-translate-y-0.5">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <Icon size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{label}</h3>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No bookings yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentBookings.map((booking) => (
              <div key={booking._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900"><ServiceLabel type={booking.serviceType} /></p>
                    <p className="text-sm text-gray-500">
                      {booking.userId?.name} → {booking.workerId?.userId?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(booking.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
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

export default AdminDashboard;