import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { EmptyState, ServiceLabel, Spinner, StatusBadge } from '../../components/common/UI';
import { AlertTriangle, Calendar, FileText, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'booking_issue', label: 'Booking issue' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'worker_conduct', label: 'Worker conduct' },
  { value: 'client_conduct', label: 'Client conduct' },
  { value: 'service_quality', label: 'Service quality' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'app_issue', label: 'App/system issue' },
  { value: 'other', label: 'Other' },
];

const priorityClasses = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const getCategoryLabel = (value) => CATEGORY_OPTIONS.find((item) => item.value === value)?.label || 'Other';

const PriorityBadge = ({ priority }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClasses[priority] || priorityClasses.medium}`}>
    {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
  </span>
);

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [edits, setEdits] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (roleFilter) params.append('reporterRole', roleFilter);
      if (search.trim()) params.append('search', search.trim());
      const { data } = await api.get(`/reports/admin/all?${params}`);
      setReports(data.reports || []);
      setPagination({ page: data.currentPage || 1, pages: data.pages || 1, total: data.total || 0 });
      const nextEdits = {};
      (data.reports || []).forEach((report) => {
        nextEdits[report._id] = {
          status: report.status,
          adminResponse: report.adminResponse || '',
        };
      });
      setEdits(nextEdits);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, roleFilter, search]);

  useEffect(() => { fetchReports(1); }, [fetchReports]);

  const counts = useMemo(() => ({
    total: pagination.total,
    open: reports.filter((report) => report.status === 'open').length,
    inReview: reports.filter((report) => report.status === 'in_review').length,
    urgent: reports.filter((report) => report.priority === 'urgent').length,
  }), [reports, pagination.total]);

  const updateEdit = (reportId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [reportId]: {
        status: prev[reportId]?.status || 'open',
        adminResponse: prev[reportId]?.adminResponse || '',
        [field]: value,
      },
    }));
  };

  const saveReport = async (reportId) => {
    setSavingId(reportId);
    try {
      const payload = edits[reportId] || { status: 'open', adminResponse: '' };
      await api.put(`/reports/admin/${reportId}/status`, payload);
      toast.success('Report updated.');
      fetchReports(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Report Management</h1>
        <p className="page-subtitle">Review user and worker reports, update statuses, and send admin responses.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium">Total Matching</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium">Open on Page</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{counts.open}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium">In Review on Page</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{counts.inReview}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium">Urgent on Page</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{counts.urgent}</p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9 py-2 text-sm"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field py-2 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="input-field py-2 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Reporters</option>
            <option value="user">Users</option>
            <option value="worker">Workers</option>
          </select>
          <button type="button" className="btn-secondary justify-center py-2" onClick={() => fetchReports(1)}>
            Apply Filters
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === filter.value ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <EmptyState title="No reports found" description="No reports match the selected filters." />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const booking = report.bookingId;
            const target = report.reporterRole === 'worker'
              ? report.reportedUserId?.name
              : report.reportedWorkerId?.userId?.name;
            const edit = edits[report._id] || { status: report.status, adminResponse: report.adminResponse || '' };

            return (
              <div key={report._id} className="card overflow-hidden">
                <div className="p-5 cursor-pointer hover:bg-slate-50/60 transition-colors" onClick={() => setExpanded(expanded === report._id ? null : report._id)}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <StatusBadge status={report.status} />
                        <PriorityBadge priority={report.priority} />
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {getCategoryLabel(report.category)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                          {report.reporterRole}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{report.subject}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-gray-700">{report.reporterId?.name || 'Unknown reporter'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                {expanded === report._id && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 mt-4">
                      <div className="space-y-4">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-start gap-2 text-gray-700">
                            <AlertTriangle size={16} className="mt-0.5 text-amber-600 flex-shrink-0" />
                            <p className="text-sm whitespace-pre-line">{report.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl border border-gray-100 p-4">
                            <p className="text-xs text-gray-400 mb-1">Reporter</p>
                            <p className="font-medium text-gray-900">{report.reporterId?.name || 'N/A'}</p>
                            <p className="text-gray-500">{report.reporterId?.email || 'No email'}</p>
                          </div>
                          <div className="rounded-xl border border-gray-100 p-4">
                            <p className="text-xs text-gray-400 mb-1">Reported Party</p>
                            <p className="font-medium text-gray-900">{target || 'Not linked'}</p>
                            <p className="text-gray-500">{booking ? 'From related booking' : 'General platform report'}</p>
                          </div>
                          <div className="rounded-xl border border-gray-100 p-4 md:col-span-2">
                            <div className="flex items-start gap-2">
                              <FileText size={15} className="mt-0.5 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Booking</p>
                                {booking ? (
                                  <>
                                    <p className="font-medium text-gray-900"><ServiceLabel type={booking.serviceType} /></p>
                                    <p className="text-gray-500">
                                      {new Date(booking.scheduleDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} at {booking.scheduleTime}
                                    </p>
                                    <p className="text-gray-500">Status: {booking.status?.replace('_', ' ')}</p>
                                  </>
                                ) : (
                                  <p className="text-gray-500">No booking selected.</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="rounded-xl border border-gray-100 p-4 md:col-span-2">
                            <div className="flex items-start gap-2">
                              <Calendar size={15} className="mt-0.5 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Timeline</p>
                                <p className="text-gray-600">Created: {new Date(report.createdAt).toLocaleString('en-PH')}</p>
                                <p className="text-gray-600">Last updated: {new Date(report.updatedAt).toLocaleString('en-PH')}</p>
                                {report.resolvedAt && <p className="text-emerald-600">Closed: {new Date(report.resolvedAt).toLocaleString('en-PH')}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 p-4 h-fit space-y-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-blue-600" />
                          <h4 className="font-semibold text-gray-900">Admin Action</h4>
                        </div>
                        <div>
                          <label className="label">Status</label>
                          <select className="input-field" value={edit.status} onChange={(e) => updateEdit(report._id, 'status', e.target.value)}>
                            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Admin Response</label>
                          <textarea
                            className="input-field resize-none"
                            rows={6}
                            value={edit.adminResponse}
                            onChange={(e) => updateEdit(report._id, 'adminResponse', e.target.value)}
                            placeholder="Write the action taken or response visible to the reporter."
                            maxLength={1000}
                          />
                          <p className="text-xs text-gray-400 mt-1">{edit.adminResponse.length}/1000 characters</p>
                        </div>
                        <button type="button" className="btn-primary w-full justify-center" onClick={() => saveReport(report._id)} disabled={savingId === report._id}>
                          {savingId === report._id ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Report Status'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button onClick={() => fetchReports(pagination.page - 1)} disabled={pagination.page === 1} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Prev</button>
          <span className="px-4 py-2 text-gray-600">Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => fetchReports(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
