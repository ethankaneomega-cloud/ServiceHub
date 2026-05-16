import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { EmptyState, ServiceLabel, Spinner, StatusBadge } from '../../components/common/UI';
import { Calendar, FileText, Flag, MessageSquare, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const CATEGORY_OPTIONS = [
  { value: 'booking_issue', label: 'Booking issue' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'worker_conduct', label: 'Worker conduct' },
  { value: 'client_conduct', label: 'Client conduct' },
  { value: 'service_quality', label: 'Service quality' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'app_issue', label: 'App/system issue' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
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

const buildBookingLabel = (booking, role) => {
  if (!booking) return 'General report / no booking selected';
  const otherParty = role === 'worker'
    ? booking.userId?.name || 'Client'
    : booking.workerId?.userId?.name || 'Worker';
  const date = booking.scheduleDate
    ? new Date(booking.scheduleDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No schedule date';
  return `${otherParty} - ${booking.serviceType?.replace('_', ' ') || 'Service'} - ${date}`;
};

const ReportsPage = ({ role = 'user' }) => {
  const [reports, setReports] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    bookingId: '',
    category: role === 'worker' ? 'client_conduct' : 'service_quality',
    priority: 'medium',
    subject: '',
    description: '',
  });

  const isWorker = role === 'worker';
  const title = isWorker ? 'Worker Reports' : 'My Reports';
  const subtitle = isWorker
    ? 'Submit job concerns, client issues, safety reports, or system problems.'
    : 'Submit booking concerns, service issues, safety reports, or system problems.';
  const bookingsEndpoint = isWorker ? '/bookings/worker-bookings?limit=100' : '/bookings/my-bookings?limit=100';

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/reports/my-reports${params}`);
      setReports(data.reports || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const { data } = await api.get(bookingsEndpoint);
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [bookingsEndpoint]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const reportCounts = useMemo(() => ({
    total: reports.length,
    open: reports.filter((report) => report.status === 'open').length,
    inReview: reports.filter((report) => report.status === 'in_review').length,
    resolved: reports.filter((report) => report.status === 'resolved').length,
  }), [reports]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.subject.trim().length < 5) {
      toast.error('Subject must be at least 5 characters.');
      return;
    }
    if (form.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        bookingId: form.bookingId || null,
        subject: form.subject.trim(),
        description: form.description.trim(),
      };
      await api.post('/reports', payload);
      toast.success('Report submitted successfully.');
      setForm({
        bookingId: '',
        category: role === 'worker' ? 'client_conduct' : 'service_quality',
        priority: 'medium',
        subject: '',
        description: '',
      });
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeReport = async (reportId) => {
    if (!confirm('Close this report? This will mark it as dismissed.')) return;
    setClosingId(reportId);
    try {
      await api.put(`/reports/${reportId}/close`);
      toast.success('Report closed.');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close report.');
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium">Current Filter</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{reportCounts.total}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium">Open</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{reportCounts.open}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium">In Review</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{reportCounts.inReview}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium">Resolved</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{reportCounts.resolved}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <form onSubmit={handleSubmit} className="card p-5 h-fit space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <Flag size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Submit a Report</h2>
              <p className="text-sm text-gray-500 mt-0.5">Attach a booking when the issue is related to a specific job.</p>
            </div>
          </div>

          <div>
            <label className="label">Related Booking optional</label>
            <select
              className="input-field"
              value={form.bookingId}
              onChange={(e) => handleChange('bookingId', e.target.value)}
              disabled={loadingBookings}
            >
              <option value="">General report / no booking selected</option>
              {bookings.map((booking) => (
                <option key={booking._id} value={booking._id}>
                  {buildBookingLabel(booking, role)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input-field" value={form.priority} onChange={(e) => handleChange('priority', e.target.value)}>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Subject</label>
            <input
              className="input-field"
              value={form.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Example: Worker did not arrive on schedule"
              maxLength={120}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input-field resize-none"
              rows={6}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Explain what happened, the date/time, and any details the admin should review."
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000 characters</p>
          </div>

          <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
            {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><MessageSquare size={16} /> Submit Report</>}
          </button>
        </form>

        <div>
          <div className="flex flex-wrap gap-2 mb-4">
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

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : reports.length === 0 ? (
            <EmptyState title="No reports found" description="Submit your first report using the form on this page." />
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const booking = report.bookingId;
                const otherParty = isWorker
                  ? report.reportedUserId?.name
                  : report.reportedWorkerId?.userId?.name;
                const canClose = ['open', 'in_review'].includes(report.status);

                return (
                  <div key={report._id} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <StatusBadge status={report.status} />
                          <PriorityBadge priority={report.priority} />
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {getCategoryLabel(report.category)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{report.subject}</h3>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{report.description}</p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
                          <div className="flex items-start gap-2">
                            <Calendar size={15} className="mt-0.5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-400">Submitted</p>
                              <p>{new Date(report.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <FileText size={15} className="mt-0.5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-400">Related Booking</p>
                              {booking ? (
                                <p>
                                  <ServiceLabel type={booking.serviceType} /> {otherParty ? `with ${otherParty}` : ''}
                                </p>
                              ) : (
                                <p>General report</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {report.adminResponse && (
                          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Admin response</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{report.adminResponse}</p>
                          </div>
                        )}
                      </div>

                      {canClose && (
                        <button
                          type="button"
                          onClick={() => closeReport(report._id)}
                          className="btn-secondary py-1.5 px-3 text-sm"
                          disabled={closingId === report._id}
                        >
                          {closingId === report._id ? <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <><XCircle size={14} /> Close</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
