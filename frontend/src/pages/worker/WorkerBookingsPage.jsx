import { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge, ServiceLabel, EmptyState, Spinner, RatingInput, RatingStars } from '../../components/common/UI';
import { MapPin, Calendar, Clock, Check, Play, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

const WorkerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingForm, setRatingForm] = useState({ rating: 5, review: '' });
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { data } = await api.get(`/bookings/worker-bookings${params}`);
      setBookings(data.bookings);
    } catch {
      toast.error('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const updateStatus = async (bookingId, status) => {
    setUpdating(bookingId + status);
    try {
      await api.put(`/bookings/${bookingId}/status`, { status });
      toast.success(`Job marked as ${status}.`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdating(null);
    }
  };

  const openRatingModal = (booking) => {
    setRatingTarget(booking);
    setRatingForm({
      rating: booking.workerRating || 5,
      review: booking.workerReview || '',
    });
  };

  const closeRatingModal = () => {
    setRatingTarget(null);
    setRatingForm({ rating: 5, review: '' });
  };

  const submitRating = async (e) => {
    e.preventDefault();
    if (!ratingTarget) return;
    if (!ratingForm.rating) {
      toast.error('Please select a rating.');
      return;
    }

    setSubmittingRating(true);
    try {
      await api.put(`/bookings/${ratingTarget._id}/rate-user`, ratingForm);
      toast.success('Client rating submitted.');
      closeRatingModal();
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Jobs</h1>
        <p className="page-subtitle">Manage service requests and rate completed clients.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <EmptyState title="No jobs found" description="No jobs match the selected filter." />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const hasRatedClient = Boolean(booking.workerRating);
            const clientRating = booking.userId?.averageRating || 0;
            const clientRatingCount = booking.userId?.ratingCount || 0;

            return (
              <div key={booking._id} className="card p-5">
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900"><ServiceLabel type={booking.serviceType} /></h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Client: <span className="font-medium">{booking.userId?.name}</span> · {booking.userId?.phone || 'No phone'}
                    </p>
                    <RatingStars rating={clientRating} count={clientRatingCount} className="mb-3" />
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(booking.scheduleDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} />{booking.scheduleTime}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={14} /><span className="truncate max-w-xs">{booking.address}</span></span>
                    </div>
                    {booking.description && <p className="text-sm text-gray-500 mt-2">{booking.description}</p>}
                    {hasRatedClient && (
                      <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Your rating for this client</p>
                        <RatingStars rating={booking.workerRating} />
                        {booking.workerReview && <p className="text-sm text-gray-600 mt-1">“{booking.workerReview}”</p>}
                      </div>
                    )}
                    {booking.userRating && (
                      <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Client rating for your service</p>
                        <RatingStars rating={booking.userRating} />
                        {booking.userReview && <p className="text-sm text-gray-600 mt-1">“{booking.userReview}”</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {booking.status === 'pending' && (
                      <button onClick={() => updateStatus(booking._id, 'accepted')} disabled={!!updating}
                        className="btn-success py-1.5 px-4 text-sm">
                        {updating === booking._id + 'accepted' ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={14} />Accept</>}
                      </button>
                    )}
                    {booking.status === 'accepted' && (
                      <button onClick={() => updateStatus(booking._id, 'in_progress')} disabled={!!updating}
                        className="btn-primary py-1.5 px-4 text-sm">
                        {updating === booking._id + 'in_progress' ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Play size={14} />Start</>}
                      </button>
                    )}
                    {booking.status === 'in_progress' && (
                      <button onClick={() => updateStatus(booking._id, 'completed')} disabled={!!updating}
                        className="btn-success py-1.5 px-4 text-sm">
                        {updating === booking._id + 'completed' ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={14} />Complete</>}
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => openRatingModal(booking)}
                        className={hasRatedClient ? 'btn-secondary py-1.5 px-4 text-sm' : 'btn-primary py-1.5 px-4 text-sm'}
                      >
                        <Star size={14} /> {hasRatedClient ? 'Edit Rating' : 'Rate Client'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ratingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900">Rate Client</h2>
            <p className="text-sm text-gray-500 mt-1">
              Share your experience with {ratingTarget.userId?.name || 'this client'}.
            </p>

            <form onSubmit={submitRating} className="mt-5 space-y-4">
              <div>
                <label className="label">Rating</label>
                <RatingInput
                  value={ratingForm.rating}
                  disabled={submittingRating}
                  onChange={(rating) => setRatingForm((prev) => ({ ...prev, rating }))}
                />
              </div>
              <div>
                <label className="label">Review optional</label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  maxLength={500}
                  value={ratingForm.review}
                  onChange={(e) => setRatingForm((prev) => ({ ...prev, review: e.target.value }))}
                  placeholder="Write a short review about the client's communication, readiness, or cooperation."
                />
                <p className="text-xs text-gray-400 mt-1">{ratingForm.review.length}/500 characters</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={closeRatingModal} disabled={submittingRating}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submittingRating}>
                  {submittingRating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Star size={16} /> Submit Rating</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerBookingsPage;
