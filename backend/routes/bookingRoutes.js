const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getWorkerBookings,
  getWorkerAnalytics,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  rateWorker,
  rateUser,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// All booking routes require authentication
router.use(protect);

router.post('/', authorize('user'), createBooking);
router.get('/my-bookings', authorize('user'), getMyBookings);
router.get('/worker-bookings', authorize('worker'), getWorkerBookings);
router.get('/worker-analytics', authorize('worker'), getWorkerAnalytics);
router.get('/:id', getBookingById);
router.put('/:id/status', authorize('worker', 'admin'), updateBookingStatus);
router.put('/:id/cancel', authorize('user'), cancelBooking);
router.put('/:id/rate-worker', authorize('user'), rateWorker);
router.put('/:id/rate-user', authorize('worker'), rateUser);

module.exports = router;
