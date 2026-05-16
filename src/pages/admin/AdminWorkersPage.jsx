import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { StatusBadge, ServiceLabel, EmptyState, Spinner } from '../../components/common/UI';
import {
  CheckCircle, XCircle, Eye, Search, Filter, ChevronDown,
  User, Briefcase, Star, Clock, MapPin, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const FILTER_OPTIONS = [
  { value: '', label: 'All Workers' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

const AdminWorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchWorkers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/admin/workers?${params}`);
      setWorkers(data.workers);
      setPagination({ page: data.currentPage, pages: data.pages, total: data.total });
    } catch {
      toast.error('Failed to load workers.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchWorkers(1); }, [fetchWorkers]);

  const handleStatusUpdate = async (workerId, status) => {
    setUpdating(workerId + status);
    try {
      await api.put(`/admin/workers/${workerId}/status`, { status, adminNotes });
      toast.success(`Worker ${status} successfully.`);
      setSelectedWorker(null);
      setAdminNotes('');
      fetchWorkers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = workers.filter(w => {
    if (!search) return true;
    const name = w.userId?.name?.toLowerCase() || '';
    const email = w.userId?.email?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Worker Management</h1>
        <p className="page-subtitle">Review applications and manage worker accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Search workers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No workers found" description="No workers match your current filters." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Worker</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Applied</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(worker => (
                  <tr key={worker._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {worker.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{worker.userId?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{worker.userId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <ServiceLabel type={worker.serviceType} />
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{worker.experience || 0} yrs</td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {worker.hourlyRate ? `₱${worker.hourlyRate.toLocaleString()}/hr` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={worker.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(worker.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedWorker(worker)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        {worker.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(worker._id, 'approved')}
                              disabled={!!updating}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Approve"
                            >
                              {updating === worker._id + 'approved'
                                ? <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block" />
                                : <CheckCircle size={16} />}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(worker._id, 'rejected')}
                              disabled={!!updating}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title="Reject"
                            >
                              {updating === worker._id + 'rejected'
                                ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                                : <XCircle size={16} />}
                            </button>
                          </>
                        )}
                        {worker.status === 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(worker._id, 'suspended')}
                            disabled={!!updating}
                            className="px-3 py-1 rounded-lg text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 font-medium transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {['rejected', 'suspended'].includes(worker.status) && (
                          <button
                            onClick={() => handleStatusUpdate(worker._id, 'approved')}
                            disabled={!!updating}
                            className="px-3 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {filtered.length} of {pagination.total} workers</span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchWorkers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >Prev</button>
                <span className="px-3 py-1">{pagination.page} / {pagination.pages}</span>
                <button
                  onClick={() => fetchWorkers(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Worker Detail Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                    {selectedWorker.userId?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedWorker.userId?.name}</h2>
                    <p className="text-sm text-gray-500">{selectedWorker.userId?.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedWorker(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Service Type</p>
                  <p className="font-medium text-sm"><ServiceLabel type={selectedWorker.serviceType} /></p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusBadge status={selectedWorker.status} />
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Experience</p>
                  <p className="font-medium text-sm">{selectedWorker.experience || 0} years</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Hourly Rate</p>
                  <p className="font-medium text-sm">
                    {selectedWorker.hourlyRate ? `₱${selectedWorker.hourlyRate.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                {selectedWorker.location && (
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="font-medium text-sm">{selectedWorker.location}</p>
                  </div>
                )}
              </div>

              {selectedWorker.bio && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Bio</p>
                  <p className="text-sm text-gray-600 bg-slate-50 rounded-xl p-3">{selectedWorker.bio}</p>
                </div>
              )}

              {/* Requirements File */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Requirements / Credentials</p>
                <a
                  href={`${API_BASE}/uploads/${selectedWorker.requirementsFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-700 hover:underline bg-blue-50 px-4 py-2 rounded-lg"
                >
                  <Download size={14} />
                  View Uploaded File
                </a>
              </div>

              {/* Admin Notes */}
              {selectedWorker.status === 'pending' && (
                <div>
                  <label className="label">Admin Notes (optional)</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Add notes for the worker..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                  />
                </div>
              )}

              {selectedWorker.adminNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Previous Admin Notes</p>
                  <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-3">{selectedWorker.adminNotes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            {selectedWorker.status === 'pending' && (
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => handleStatusUpdate(selectedWorker._id, 'approved')}
                  disabled={!!updating}
                  className="btn-success flex-1 justify-center"
                >
                  {updating === selectedWorker._id + 'approved'
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><CheckCircle size={16} /> Approve</>}
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedWorker._id, 'rejected')}
                  disabled={!!updating}
                  className="btn-danger flex-1 justify-center"
                >
                  {updating === selectedWorker._id + 'rejected'
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><XCircle size={16} /> Reject</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkersPage;
