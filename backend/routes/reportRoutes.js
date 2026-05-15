const express = require('express');
const router = express.Router();
const {
  createReport,
  getMyReports,
  getAllReports,
  getReportById,
  updateMyReport,
  closeMyReport,
  updateReportStatus,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/admin/all', authorize('admin'), getAllReports);
router.put('/admin/:id/status', authorize('admin'), updateReportStatus);

router.post('/', authorize('user', 'worker'), createReport);
router.get('/my-reports', authorize('user', 'worker'), getMyReports);
router.get('/:id', getReportById);
router.put('/:id', authorize('user', 'worker'), updateMyReport);
router.put('/:id/close', authorize('user', 'worker'), closeMyReport);

module.exports = router;
