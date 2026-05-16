const Worker = require('../models/Worker');
const User = require('../models/User');
const Service = require('../models/Service');

// @desc    Get all approved workers (public)
// @route   GET /api/workers
// @access  Public
const getWorkers = async (req, res, next) => {
  try {
    const { serviceType, page = 1, limit = 12 } = req.query;

    const query = { isApproved: true, status: 'approved' };
    const activeServiceIds = await Service.distinct('id', { isActive: true });

    if (serviceType) {
      if (activeServiceIds.length > 0 && !activeServiceIds.includes(serviceType)) {
        return res.json({
          success: true,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: parseInt(page),
          workers: [],
        });
      }
      query.serviceType = serviceType;
    } else if (activeServiceIds.length > 0) {
      query.serviceType = { $in: activeServiceIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Worker.countDocuments(query);

    const workers = await Worker.find(query)
      .populate('userId', 'name email phone profilePicture')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1, createdAt: -1 });

    res.json({
      success: true,
      count: workers.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      workers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single worker by ID
// @route   GET /api/workers/:id
// @access  Public
const getWorkerById = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id).populate(
      'userId',
      'name email phone profilePicture createdAt'
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    res.json({ success: true, worker });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current worker profile
// @route   GET /api/workers/me/profile
// @access  Private (worker only)
const getMyProfile = async (req, res, next) => {
  try {
    const worker = await Worker.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email phone profilePicture'
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    res.json({ success: true, worker });
  } catch (error) {
    next(error);
  }
};

// @desc    Update worker profile
// @route   PUT /api/workers/me/profile
// @access  Private (worker only)
const updateMyProfile = async (req, res, next) => {
  try {
    const { bio, experience, hourlyRate, location } = req.body;

    const worker = await Worker.findOneAndUpdate(
      { userId: req.user._id },
      { bio, experience, hourlyRate, location },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone profilePicture');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    res.json({ success: true, message: 'Profile updated.', worker });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkers, getWorkerById, getMyProfile, updateMyProfile };
