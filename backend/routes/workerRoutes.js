const express = require('express');
const router = express.Router();
const { getWorkers, getWorkerById, getMyProfile, updateMyProfile } = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getWorkers);
router.get('/:id', getWorkerById);

// Private routes (worker only)
router.get('/me/profile', protect, authorize('worker'), getMyProfile);
router.put('/me/profile', protect, authorize('worker'), updateMyProfile);

module.exports = router;
