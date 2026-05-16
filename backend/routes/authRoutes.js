const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, registerWorker, login, getMe, updateProfile, updateProfilePicture, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const profileUpload = require('../middleware/profileUpload');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const workerRegisterValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
];

// Routes
router.post('/register', registerValidation, register);
router.post('/register-worker', upload.single('requirementsFile'), workerRegisterValidation, registerWorker);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/profile-picture', protect, profileUpload.single('profilePicture'), updateProfilePicture);
router.put('/change-password', protect, changePassword);

module.exports = router;
