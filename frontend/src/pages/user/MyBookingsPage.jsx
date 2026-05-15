import { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge, ServiceLabel, EmptyState, Spinner, RatingInput, RatingStars } from '../../components/common/UI';
import { MapPin, Calendar, Clock, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingForm, setRatingForm] = useState({ rating: 5, review: '' });
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { data } = await api.get(`/bookings/my-bookings${params}`);
      setBookings(data.bookings);
    } catch {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/cancel`, { cancelReason: 'Cancelled by user' });
      toast.success('Booking cancelled.');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel.');
    } finally {
      setCancelling(null);
    }
  };

  const openRatingModal = (booking) => {
    setRatingTarget(booking);
    setRatingForm({
      rating: booking.userRating || booking.rating || 5,
      review: booking.userReview || booking.review || '',
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
      await api.put(`/bookings/${ratingTarget._id}/rate-worker`, ratingForm);
      toast.success('Worker rating submitted.');
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
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Track your service requests and rate completed workers.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings found" description="You haven't made any bookings yet or none match the selected filter." />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const workerRating = booking.workerId?.rating || 0;
            const workerRatingCount = booking.workerId?.ratingCount || 0;
            const hasRatedWorker = Boolean(booking.userRating || booking.rating);

            return (
              <div key={booking._id} className="card p-5">
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        <ServiceLabel type={booking.serviceType} />
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Worker: <span className="font-medium">{booking.workerId?.userId?.name || 'N/A'}</span>
                    </p>
                    <RatingStars rating={workerRating} count={workerRatingCount} className="mb-3" />
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(booking.scheduleDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {booking.scheduleTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        <span className="truncate max-w-xs">{booking.address}</span>
                      </span>
                    </div>
                    {booking.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{booking.description}</p>
                    )}
                    {booking.cancelReason && (
                      <p className="text-sm text-red-500 mt-2">Reason: {booking.cancelReason}</p>
                    )}
                    {hasRatedWorker && (
                      <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Your rating for this worker</p>
                        <RatingStars rating={booking.userRating || booking.rating} />
                        {(booking.userReview || booking.review) && (
                          <p className="text-sm text-gray-600 mt-1">“{booking.userReview || booking.review}”</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {booking.price && (
                      <p className="text-lg font-bold text-gray-900">₱{booking.price.toLocaleString()}/hr</p>
                    )}
                    {['pending', 'accepted'].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancelling === booking._id}
                        className="btn-danger py-1.5 px-3 text-sm"
                      >
                        {cancelling === booking._id ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><X size={14} /> Cancel</>
                        )}
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => openRatingModal(booking)}
                        className={hasRatedWorker ? 'btn-secondary py-1.5 px-3 text-sm' : 'btn-primary py-1.5 px-3 text-sm'}
                      >
                        <Star size={14} /> {hasRatedWorker ? 'Edit Rating' : 'Rate Worker'}
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
            <h2 className="text-xl font-bold text-gray-900">Rate Worker</h2>
            <p className="text-sm text-gray-500 mt-1">
              Share your experience with {ratingTarget.workerId?.userId?.name || 'this worker'}.
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
                  placeholder="Write a short review about the service quality, professionalism, or result."
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

export default MyBookingsPage;
