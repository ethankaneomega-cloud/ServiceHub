import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { ServiceLabel, Spinner } from '../../components/common/UI';
import {
  BarChart3,
  CheckCircle,
  ClipboardList,
  Clock,
  MessageSquare,
  Percent,
  Star,
  Trophy,
  Wallet,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

const formatCurrency = (value = 0) => currencyFormatter.format(Number(value) || 0);
const formatNumber = (value = 0) => new Intl.NumberFormat('en-PH').format(Number(value) || 0);
const formatPercent = (value = 0) => `${Number(value || 0).toFixed(Number(value) % 1 === 0 ? 0 : 1)}%`;

const AnalyticsCard = ({ label, value, icon: Icon, helper, iconClass = 'bg-blue-50 text-blue-600' }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 truncate">{value}</p>
        {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const MiniBarChart = ({ data = [], valueKey, formatter = formatNumber, emptyLabel = 'No monthly data yet.' }) => {
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 0);

  if (!data.length || maxValue === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 6 : 0) : 0;
        return (
          <div key={item.key} className="grid grid-cols-[78px_1fr_88px] sm:grid-cols-[94px_1fr_110px] items-center gap-3 text-sm">
            <span className="text-gray-500 truncate">{item.label}</span>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
            </div>
            <span className="text-right font-medium text-gray-700 truncate">{formatter(value)}</span>
          </div>
        );
      })}
    </div>
  );
};

const RatingBreakdown = ({ breakdown = [] }) => {
  const hasRatings = breakdown.some((item) => item.count > 0);

  if (!hasRatings) {
    return <div className="py-8 text-center text-sm text-gray-400">No ratings yet.</div>;
  }

  return (
    <div className="space-y-3">
      {breakdown.map((item) => (
        <div key={item.rating} className="grid grid-cols-[58px_1fr_72px] items-center gap-3 text-sm">
          <span className="font-medium text-gray-700">{item.rating} ★</span>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${item.percentage}%` }} />
          </div>
          <span className="text-right text-gray-500">{item.count} ({item.percentage}%)</span>
        </div>
      ))}
    </div>
  );
};

const FeedbackList = ({ feedback = [] }) => {
  if (!feedback.length) {
    return <div className="py-10 text-center text-sm text-gray-400">No written feedback yet.</div>;
  }

  return (
    <div className="divide-y divide-gray-50">
      {feedback.map((item) => (
        <div key={item.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{item.clientName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <ServiceLabel type={item.serviceType} /> · {item.date ? new Date(item.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Star size={13} className="fill-current" /> {item.rating}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">“{item.review}”</p>
        </div>
      ))}
    </div>
  );
};

const WorkerAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/bookings/worker-analytics');
        setAnalytics(data.analytics);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load worker analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const summary = useMemo(() => {
    const statusCounts = analytics?.bookings?.statusCounts || {};
    return {
      totalEarnings: analytics?.earnings?.total || 0,
      totalBookings: analytics?.bookings?.total || 0,
      completed: statusCounts.completed || 0,
      pending: statusCounts.pending || 0,
      cancelled: statusCounts.cancelled || 0,
      averageRating: analytics?.ratings?.average || 0,
      totalRatings: analytics?.ratings?.totalRatings || 0,
      completionRate: analytics?.performance?.completionRate || 0,
      acceptanceRate: analytics?.performance?.acceptanceRate || 0,
    };
  }, [analytics]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Worker Analytics Overview</h1>
        <p className="page-subtitle">Track your earnings, bookings, ratings, and service performance.</p>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={20} className="text-blue-700" />
          <h2 className="text-lg font-semibold text-gray-900">Earnings Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <AnalyticsCard label="Total Earnings" value={formatCurrency(summary.totalEarnings)} icon={Wallet} helper="Completed paid jobs" />
          <AnalyticsCard
            label="Highest Earning Service"
            value={analytics?.earnings?.highestEarningService?.label || 'No completed jobs'}
            icon={Trophy}
            helper={analytics?.earnings?.highestEarningService ? `${formatCurrency(analytics.earnings.highestEarningService.earnings)} from ${formatNumber(analytics.earnings.highestEarningService.bookings)} job(s)` : 'Complete jobs to generate earnings'}
            iconClass="bg-amber-50 text-amber-600"
          />
          <AnalyticsCard
            label="Average Monthly Earnings"
            value={formatCurrency((analytics?.earnings?.monthly || []).reduce((sum, item) => sum + (Number(item.earnings) || 0), 0) / 12)}
            icon={BarChart3}
            helper="Based on the last 12 months"
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Earnings Chart</h3>
          <MiniBarChart data={analytics?.earnings?.monthly || []} valueKey="earnings" formatter={formatCurrency} emptyLabel="No completed job earnings yet." />
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={20} className="text-blue-700" />
          <h2 className="text-lg font-semibold text-gray-900">Bookings Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AnalyticsCard label="Total Bookings" value={formatNumber(summary.totalBookings)} icon={ClipboardList} />
          <AnalyticsCard label="Completed" value={formatNumber(summary.completed)} icon={CheckCircle} iconClass="bg-emerald-50 text-emerald-600" />
          <AnalyticsCard label="Pending" value={formatNumber(summary.pending)} icon={Clock} iconClass="bg-amber-50 text-amber-600" />
          <AnalyticsCard label="Cancelled" value={formatNumber(summary.cancelled)} icon={XCircle} iconClass="bg-red-50 text-red-600" />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Booking Chart</h3>
          <MiniBarChart data={analytics?.bookings?.monthly || []} valueKey="bookings" emptyLabel="No booking requests yet." />
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star size={20} className="text-blue-700" />
          <h2 className="text-lg font-semibold text-gray-900">Ratings & Reviews</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <div className="space-y-4">
            <AnalyticsCard
              label="Average Rating"
              value={summary.totalRatings > 0 ? `${summary.averageRating.toFixed(summary.averageRating % 1 === 0 ? 0 : 1)} / 5` : 'No ratings'}
              icon={Star}
              helper={summary.totalRatings > 0 ? `${formatNumber(summary.totalRatings)} rating(s) received` : 'Ratings appear after completed jobs'}
              iconClass="bg-amber-50 text-amber-600"
            />
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">5-Star Breakdown</h3>
              <RatingBreakdown breakdown={analytics?.ratings?.breakdown || []} />
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-blue-700" />
              <h3 className="font-semibold text-gray-900">Recent Feedback</h3>
            </div>
            <FeedbackList feedback={analytics?.ratings?.recentFeedback || []} />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Percent size={20} className="text-blue-700" />
          <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnalyticsCard
            label="Completion Rate"
            value={formatPercent(summary.completionRate)}
            icon={CheckCircle}
            helper="Completed jobs divided by total bookings"
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <AnalyticsCard
            label="Acceptance Rate"
            value={formatPercent(summary.acceptanceRate)}
            icon={Percent}
            helper="Accepted, in-progress, and completed bookings"
            iconClass="bg-purple-50 text-purple-600"
          />
          <AnalyticsCard
            label="Most Requested Service"
            value={analytics?.performance?.mostRequestedService?.label || 'No requests yet'}
            icon={Trophy}
            helper={analytics?.performance?.mostRequestedService ? `${formatNumber(analytics.performance.mostRequestedService.bookings)} booking request(s)` : 'Requests will appear here'}
            iconClass="bg-blue-50 text-blue-600"
          />
        </div>
      </section>
    </div>
  );
};

export default WorkerAnalyticsPage;
