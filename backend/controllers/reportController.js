const Report = require('../models/Report');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

const REPORT_POPULATE = [
  { path: 'reporterId', select: 'name email phone role profilePicture' },
  {
    path: 'bookingId',
    select: 'serviceType scheduleDate scheduleTime status address price userId workerId',
    populate: [
      { path: 'userId', select: 'name email phone profilePicture' },
      { path: 'workerId', populate: { path: 'userId', select: 'name email phone profilePicture' } },
    ],
  },
  { path: 'reportedUserId', select: 'name email phone role profilePicture' },
  { path: 'reportedWorkerId', populate: { path: 'userId', select: 'name email phone profilePicture' } },
  { path: 'lastUpdatedBy', select: 'name email role' },
];

const VALID_CATEGORIES = [
  'booking_issue',
  'payment_issue',
  'worker_conduct',
  'client_conduct',
  'service_quality',
  'safety',
  'app_issue',
  'other',
];

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['open', 'in_review', 'resolved', 'dismissed'];

const cleanText = (value = '', max = 2000) => String(value || '').trim().slice(0, max);

const getPaging = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const populateReport = async (report) => {
  await report.populate(REPORT_POPULATE);
  return report;
};

const getAccessibleBookingContext = async (bookingId, user) => {
  if (!bookingId) return { booking: null, workerProfile: null };

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'user') {
    if (booking.userId.toString() !== user._id.toString()) {
      const error = new Error('You can only report your own bookings.');
      error.statusCode = 403;
      throw error;
    }
    return { booking, workerProfile: null };
  }

  if (user.role === 'worker') {
    const workerProfile = await Worker.findOne({ userId: user._id });
    if (!workerProfile) {
      const error = new Error('Worker profile not found.');
      error.statusCode = 404;
      throw error;
    }
    if (booking.workerId.toString() !== workerProfile._id.toString()) {
      const error = new Error('You can only report bookings assigned to you.');
      error.statusCode = 403;
      throw error;
    }
    return { booking, workerProfile };
  }

  const error = new Error('Only users and workers can create reports.');
  error.statusCode = 403;
  throw error;
};

// @desc    Create a report from a user or worker
// @route   POST /api/reports
// @access  Private (user, worker)
const createReport = async (req, res, next) => {
  try {
    const category = VALID_CATEGORIES.includes(req.body.category) ? req.body.category : 'other';
    const priority = VALID_PRIORITIES.includes(req.body.priority) ? req.body.priority : 'medium';
    const subject = cleanText(req.body.subject, 120);
    const description = cleanText(req.body.description, 2000);
    const bookingId = req.body.bookingId || null;

    if (subject.length < 5) {
      return res.status(400).json({ success: false, message: 'Subject must be at least 5 characters.' });
    }
    if (description.length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters.' });
    }

    const { booking } = await getAccessibleBookingContext(bookingId, req.user);

    const reportPayload = {
      reporterId: req.user._id,
      reporterRole: req.user.role,
      bookingId: booking ? booking._id : null,
      category,
      priority,
      subject,
      description,
      status: 'open',
      lastUpdatedBy: req.user._id,
    };

    if (booking && req.user.role === 'user') {
      reportPayload.reportedWorkerId = booking.workerId;
    }
    if (booking && req.user.role === 'worker') {
      reportPayload.reportedUserId = booking.userId;
    }

    const report = await Report.create(reportPayload);
    await populateReport(report);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      report,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get reports created by current user or worker
// @route   GET /api/reports/my-reports
// @access  Private (user, worker)
const getMyReports = async (req, res, next) => {
  try {
    const { status, category, priority } = req.query;
    const { page, limit, skip } = getPaging(req.query);
    const query = { reporterId: req.user._id };

    if (VALID_STATUSES.includes(status)) query.status = status;
    if (VALID_CATEGORIES.includes(category)) query.category = category;
    if (VALID_PRIORITIES.includes(priority)) query.priority = priority;

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate(REPORT_POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      total,
      pages: Math.ceil(total / limit) || 1,
      currentPage: page,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports for admin
// @route   GET /api/reports/admin/all
// @access  Private (admin)
const getAllReports = async (req, res, next) => {
  try {
    const { status, category, priority, reporterRole, search } = req.query;
    const { page, limit, skip } = getPaging(req.query);
    const query = {};

    if (VALID_STATUSES.includes(status)) query.status = status;
    if (VALID_CATEGORIES.includes(category)) query.category = category;
    if (VALID_PRIORITIES.includes(priority)) query.priority = priority;
    if (['user', 'worker'].includes(reporterRole)) query.reporterRole = reporterRole;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate(REPORT_POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const statusCounts = await Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const priorityCounts = await Report.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);

    res.json({
      success: true,
      count: reports.length,
      total,
      pages: Math.ceil(total / limit) || 1,
      currentPage: page,
      reports,
      statusCounts,
      priorityCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate(REPORT_POPULATE);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const isOwner = report.reporterId?._id?.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Update own report while it is still open or in review
// @route   PUT /api/reports/:id
// @access  Private (user, worker)
const updateMyReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    if (report.reporterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own reports.' });
    }
    if (['resolved', 'dismissed'].includes(report.status)) {
      return res.status(400).json({ success: false, message: 'Resolved or dismissed reports can no longer be edited.' });
    }

    const subject = cleanText(req.body.subject, 120);
    const description = cleanText(req.body.description, 2000);
    if (subject.length < 5) {
      return res.status(400).json({ success: false, message: 'Subject must be at least 5 characters.' });
    }
    if (description.length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters.' });
    }

    report.subject = subject;
    report.description = description;
    if (VALID_CATEGORIES.includes(req.body.category)) report.category = req.body.category;
    if (VALID_PRIORITIES.includes(req.body.priority)) report.priority = req.body.priority;
    report.lastUpdatedBy = req.user._id;

    await report.save();
    await populateReport(report);

    res.json({ success: true, message: 'Report updated successfully.', report });
  } catch (error) {
    next(error);
  }
};

// @desc    Reporter closes own report
// @route   PUT /api/reports/:id/close
// @access  Private (user, worker)
const closeMyReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    if (report.reporterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only close your own reports.' });
    }
    if (['resolved', 'dismissed'].includes(report.status)) {
      return res.status(400).json({ success: false, message: 'This report is already closed.' });
    }

    report.status = 'dismissed';
    report.adminResponse = report.adminResponse || 'Closed by reporter.';
    report.resolvedAt = new Date();
    report.lastUpdatedBy = req.user._id;
    await report.save();
    await populateReport(report);

    res.json({ success: true, message: 'Report closed successfully.', report });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin updates report status and response
// @route   PUT /api/reports/admin/:id/status
// @access  Private (admin)
const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const adminResponse = cleanText(req.body.adminResponse, 1000);

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.status = status;
    report.adminResponse = adminResponse;
    report.lastUpdatedBy = req.user._id;
    report.resolvedAt = ['resolved', 'dismissed'].includes(status) ? new Date() : null;

    await report.save();
    await populateReport(report);

    res.json({ success: true, message: 'Report status updated successfully.', report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getMyReports,
  getAllReports,
  getReportById,
  updateMyReport,
  closeMyReport,
  updateReportStatus,
};
