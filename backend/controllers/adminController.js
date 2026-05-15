const User = require('../models/User');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Report = require('../models/Report');
const { seedDefaultServices } = require('./serviceController');

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private (admin)
const getStats = async (req, res, next) => {
  try {
    await seedDefaultServices();

    const [
      totalUsers,
      totalWorkers,
      totalBookings,
      totalServices,
      pendingWorkers,
      pendingBookings,
      totalReports,
      openReports,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Worker.countDocuments(),
      Booking.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Worker.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Report.countDocuments({ status: { $in: ['open', 'in_review'] } }),
    ]);

    const bookingStatusCounts = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const workerStatusCounts = await Worker.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate({ path: 'workerId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalWorkers,
        totalBookings,
        totalServices,
        pendingWorkers,
        pendingBookings,
        totalReports,
        openReports,
        bookingsByStatus: bookingStatusCounts,
        workersByStatus: workerStatusCounts,
      },
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workers (including pending)
// @route   GET /api/admin/workers
// @access  Private (admin)
const getAllWorkers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Worker.countDocuments(query);

    const workers = await Worker.find(query)
      .populate('userId', 'name email phone profilePicture createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: workers.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      workers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a worker
// @route   PUT /api/admin/workers/:id/status
// @access  Private (admin)
const updateWorkerStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    worker.status = status;
    worker.isApproved = status === 'approved';
    if (adminNotes) worker.adminNotes = adminNotes;
    await worker.save();

    await worker.populate('userId', 'name email');

    res.json({
      success: true,
      message: `Worker ${status} successfully.`,
      worker,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings
// @access  Private (admin)
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone profilePicture')
      .populate({ path: 'workerId', populate: { path: 'userId', select: 'name email' } })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot deactivate an admin.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAllUsers,
  getAllWorkers,
  updateWorkerStatus,
  getAllBookings,
  toggleUserStatus,
};
