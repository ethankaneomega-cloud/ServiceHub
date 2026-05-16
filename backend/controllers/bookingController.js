const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const User = require('../models/User');
const Service = require('../models/Service');

const BOOKING_POPULATE = [
  { path: 'userId', select: 'name email phone address profilePicture averageRating ratingCount' },
  { path: 'workerId', populate: { path: 'userId', select: 'name email phone profilePicture' } },
];

const normalizeRating = (value) => {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
};

const normalizeReview = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 500);
};

const roundRating = (value) => Math.round(value * 10) / 10;

const refreshWorkerRating = async (workerId) => {
  const [stats] = await Booking.aggregate([
    {
      $match: {
        workerId,
        status: 'completed',
        userRating: { $gte: 1, $lte: 5 },
      },
    },
    {
      $group: {
        _id: '$workerId',
        averageRating: { $avg: '$userRating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  await Worker.findByIdAndUpdate(workerId, {
    rating: stats ? roundRating(stats.averageRating) : 0,
    ratingCount: stats ? stats.ratingCount : 0,
  });
};

const refreshUserRating = async (userId) => {
  const [stats] = await Booking.aggregate([
    {
      $match: {
        userId,
        status: 'completed',
        workerRating: { $gte: 1, $lte: 5 },
      },
    },
    {
      $group: {
        _id: '$userId',
        averageRating: { $avg: '$workerRating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  await User.findByIdAndUpdate(userId, {
    averageRating: stats ? roundRating(stats.averageRating) : 0,
    ratingCount: stats ? stats.ratingCount : 0,
  });
};

const populateBooking = async (booking) => {
  await booking.populate(BOOKING_POPULATE);
  return booking;
};

const MONTH_FORMAT_OPTIONS = { month: 'short', year: 'numeric' };

const formatMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildMonthlyBuckets = (monthsBack = 12) => {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

  return Array.from({ length: monthsBack }, (_, index) => {
    const monthDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    return {
      key: formatMonthKey(monthDate),
      label: monthDate.toLocaleDateString('en-US', MONTH_FORMAT_OPTIONS),
      earnings: 0,
      bookings: 0,
    };
  });
};

const mapStatusCounts = (items = []) => {
  const counts = { pending: 0, accepted: 0, in_progress: 0, completed: 0, cancelled: 0 };
  items.forEach((item) => {
    if (item?._id) counts[item._id] = item.count;
  });
  return counts;
};

const mapRatingBreakdown = (items = [], totalRatings = 0) => {
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  items.forEach((item) => {
    if (item?._id >= 1 && item?._id <= 5) breakdown[item._id] = item.count;
  });

  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: breakdown[rating],
    percentage: totalRatings > 0 ? Math.round((breakdown[rating] / totalRatings) * 100) : 0,
  }));
};

const getServiceLabel = (serviceType = '') => {
  if (!serviceType) return 'Service';
  return serviceType
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const roundPercent = (value) => Math.round(value * 10) / 10;


// @desc    Get analytics overview for current worker
// @route   GET /api/bookings/worker-analytics
// @access  Private (worker)
const getWorkerAnalytics = async (req, res, next) => {
  try {
    const worker = await Worker.findOne({ userId: req.user._id });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const workerId = worker._id;
    const monthlyBuckets = buildMonthlyBuckets(12);
    const firstBucketDate = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);

    const [
      totalBookings,
      statusCountsRaw,
      earningsRaw,
      monthlyEarningsRaw,
      monthlyBookingsRaw,
      highestEarningServiceRaw,
      mostRequestedServiceRaw,
      ratingStatsRaw,
      ratingBreakdownRaw,
      recentFeedback,
    ] = await Promise.all([
      Booking.countDocuments({ workerId }),
      Booking.aggregate([
        { $match: { workerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { workerId, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: { $ifNull: ['$price', 0] } },
            completedJobs: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        {
          $match: {
            workerId,
            status: 'completed',
            $or: [{ completedAt: { $gte: firstBucketDate } }, { updatedAt: { $gte: firstBucketDate } }],
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: { $ifNull: ['$completedAt', '$updatedAt'] },
              },
            },
            earnings: { $sum: { $ifNull: ['$price', 0] } },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { workerId, createdAt: { $gte: firstBucketDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { workerId, status: 'completed' } },
        {
          $group: {
            _id: '$serviceType',
            earnings: { $sum: { $ifNull: ['$price', 0] } },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { earnings: -1, bookings: -1 } },
        { $limit: 1 },
      ]),
      Booking.aggregate([
        { $match: { workerId } },
        { $group: { _id: '$serviceType', bookings: { $sum: 1 } } },
        { $sort: { bookings: -1 } },
        { $limit: 1 },
      ]),
      Booking.aggregate([
        { $match: { workerId, status: 'completed', userRating: { $gte: 1, $lte: 5 } } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$userRating' },
            totalRatings: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { workerId, status: 'completed', userRating: { $gte: 1, $lte: 5 } } },
        { $group: { _id: '$userRating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
      Booking.find({
        workerId,
        status: 'completed',
        userRating: { $gte: 1, $lte: 5 },
        userReview: { $exists: true, $ne: '' },
      })
        .populate('userId', 'name profilePicture')
        .sort({ userRatedAt: -1, updatedAt: -1 })
        .limit(5)
        .select('serviceType userRating userReview userRatedAt updatedAt userId'),
    ]);

    const statusCounts = mapStatusCounts(statusCountsRaw);
    const earningsStats = earningsRaw[0] || { totalEarnings: 0, completedJobs: 0 };
    const ratingStats = ratingStatsRaw[0] || { averageRating: 0, totalRatings: 0 };

    const monthlyEarningsByKey = new Map(monthlyEarningsRaw.map((item) => [item._id, item]));
    const monthlyBookingsByKey = new Map(monthlyBookingsRaw.map((item) => [item._id, item]));
    const monthly = monthlyBuckets.map((bucket) => ({
      ...bucket,
      earnings: monthlyEarningsByKey.get(bucket.key)?.earnings || 0,
      completedBookings: monthlyEarningsByKey.get(bucket.key)?.bookings || 0,
      bookings: monthlyBookingsByKey.get(bucket.key)?.bookings || 0,
    }));

    const acceptedBookings = statusCounts.accepted + statusCounts.in_progress + statusCounts.completed;
    const completionRate = totalBookings > 0 ? roundPercent((statusCounts.completed / totalBookings) * 100) : 0;
    const acceptanceRate = totalBookings > 0 ? roundPercent((acceptedBookings / totalBookings) * 100) : 0;

    const highestEarningService = highestEarningServiceRaw[0]
      ? {
          serviceType: highestEarningServiceRaw[0]._id,
          label: getServiceLabel(highestEarningServiceRaw[0]._id),
          earnings: highestEarningServiceRaw[0].earnings,
          bookings: highestEarningServiceRaw[0].bookings,
        }
      : null;

    const mostRequestedService = mostRequestedServiceRaw[0]
      ? {
          serviceType: mostRequestedServiceRaw[0]._id,
          label: getServiceLabel(mostRequestedServiceRaw[0]._id),
          bookings: mostRequestedServiceRaw[0].bookings,
        }
      : null;

    res.json({
      success: true,
      analytics: {
        earnings: {
          total: earningsStats.totalEarnings || 0,
          monthly,
          highestEarningService,
        },
        bookings: {
          total: totalBookings,
          statusCounts,
          monthly,
        },
        ratings: {
          average: roundRating(ratingStats.averageRating || worker.rating || 0),
          totalRatings: ratingStats.totalRatings || worker.ratingCount || 0,
          breakdown: mapRatingBreakdown(ratingBreakdownRaw, ratingStats.totalRatings || 0),
          recentFeedback: recentFeedback.map((booking) => ({
            id: booking._id,
            clientName: booking.userId?.name || 'Client',
            serviceType: booking.serviceType,
            rating: booking.userRating,
            review: booking.userReview,
            date: booking.userRatedAt || booking.updatedAt,
          })),
        },
        performance: {
          completionRate,
          acceptanceRate,
          mostRequestedService,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (user only)
const createBooking = async (req, res, next) => {
  try {
    const { workerId, serviceType, scheduleDate, scheduleTime, address, description } = req.body;

    // Verify worker exists and is approved
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }
    if (!worker.isApproved || worker.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'This worker is not yet approved.' });
    }

    // Ensure service type matches worker's specialization
    if (worker.serviceType !== serviceType) {
      return res.status(400).json({
        success: false,
        message: `This worker provides ${worker.serviceType} services, not ${serviceType}.`,
      });
    }

    const service = await Service.findOne({ id: worker.serviceType });
    if (service && !service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This service is currently unavailable.',
      });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      workerId,
      serviceType,
      scheduleDate: new Date(scheduleDate),
      scheduleTime,
      address,
      description,
      price: worker.hourlyRate,
      status: 'pending',
    });

    await populateBooking(booking);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for current user
// @route   GET /api/bookings/my-bookings
// @access  Private (user)
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate(BOOKING_POPULATE)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for current worker
// @route   GET /api/bookings/worker-bookings
// @access  Private (worker)
const getWorkerBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const worker = await Worker.findOne({ userId: req.user._id });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const query = { workerId: worker._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone address profilePicture averageRating ratingCount')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(BOOKING_POPULATE);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Ensure user can only see their own bookings (unless admin)
    const worker = await Worker.findOne({ userId: req.user._id });
    const isOwner = booking.userId._id.toString() === req.user._id.toString();
    const isWorker = worker && booking.workerId._id.toString() === worker._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isWorker && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, notes, cancelReason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const worker = await Worker.findOne({ userId: req.user._id });

    // Define who can update to what status
    const userRole = req.user.role;
    const isBookingOwner = booking.userId.toString() === req.user._id.toString();
    const isAssignedWorker = worker && booking.workerId.toString() === worker._id.toString();

    // Validation: workers can accept/complete, users can cancel
    if (userRole === 'worker') {
      if (!isAssignedWorker) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
      if (!['accepted', 'in_progress', 'completed'].includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: 'Workers can only accept, start, or complete bookings.' });
      }
    } else if (userRole === 'user') {
      if (!isBookingOwner) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
      if (status !== 'cancelled') {
        return res.status(400).json({ success: false, message: 'Users can only cancel bookings.' });
      }
      if (['completed', 'cancelled'].includes(booking.status)) {
        return res
          .status(400)
          .json({ success: false, message: 'Cannot cancel a completed or already cancelled booking.' });
      }
    }

    const previousStatus = booking.status;
    booking.status = status;
    if (notes) booking.notes = notes;
    if (cancelReason) booking.cancelReason = cancelReason;
    if (status === 'completed' && previousStatus !== 'completed') {
      booking.completedAt = new Date();
      // Update worker's total jobs
      await Worker.findByIdAndUpdate(booking.workerId, { $inc: { totalJobs: 1 } });
    }

    await booking.save();
    await populateBooking(booking);

    res.json({
      success: true,
      message: `Booking ${status} successfully.`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking (user)
// @route   PUT /api/bookings/:id/cancel
// @access  Private (user)
const cancelBooking = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking.' });
    }

    booking.status = 'cancelled';
    booking.cancelReason = cancelReason || 'Cancelled by user';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled.', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    User rates the worker after a completed booking
// @route   PUT /api/bookings/:id/rate-worker
// @access  Private (user)
const rateWorker = async (req, res, next) => {
  try {
    const rating = normalizeRating(req.body.rating);
    const review = normalizeReview(req.body.review);

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only rate your own completed bookings.' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can rate the worker only after the booking is completed.' });
    }

    booking.userRating = rating;
    booking.userReview = review;
    booking.userRatedAt = new Date();
    // Keep old fields populated for old UI/data compatibility.
    booking.rating = rating;
    booking.review = review;
    await booking.save();

    await refreshWorkerRating(booking.workerId);
    await populateBooking(booking);

    res.json({
      success: true,
      message: 'Worker rating submitted successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Worker rates the user/client after a completed booking
// @route   PUT /api/bookings/:id/rate-user
// @access  Private (worker)
const rateUser = async (req, res, next) => {
  try {
    const rating = normalizeRating(req.body.rating);
    const review = normalizeReview(req.body.review);

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5.' });
    }

    const worker = await Worker.findOne({ userId: req.user._id });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.workerId.toString() !== worker._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only rate clients from your own completed jobs.' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can rate the client only after the booking is completed.' });
    }

    booking.workerRating = rating;
    booking.workerReview = review;
    booking.workerRatedAt = new Date();
    await booking.save();

    await refreshUserRating(booking.userId);
    await populateBooking(booking);

    res.json({
      success: true,
      message: 'Client rating submitted successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getWorkerBookings,
  getWorkerAnalytics,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  rateWorker,
  rateUser,
};
