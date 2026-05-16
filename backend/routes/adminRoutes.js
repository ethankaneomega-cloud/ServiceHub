const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllUsers,
  getAllWorkers,
  updateWorkerStatus,
  getAllBookings,
  toggleUserStatus,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/workers', getAllWorkers);
router.put('/workers/:id/status', updateWorkerStatus);
router.get('/bookings', getAllBookings);

module.exports = router;
