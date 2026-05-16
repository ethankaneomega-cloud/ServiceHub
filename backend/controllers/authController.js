const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Service = require('../models/Service');
const fs = require('fs');
const path = require('path');


// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Only allow 'user' role via this endpoint; worker uses separate flow
    const allowedRoles = ['user'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.create({ name, email, password, role: userRole, phone, address });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
        averageRating: user.averageRating,
        ratingCount: user.ratingCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register as a worker (with file upload)
// @route   POST /api/auth/register-worker
// @access  Public
const registerWorker = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Requirements/credentials file is required.',
      });
    }

    const { name, email, password, serviceType, bio, experience, hourlyRate, phone, location } =
      req.body;

    const serviceCount = await Service.countDocuments();
    if (serviceCount > 0) {
      const service = await Service.findOne({ id: serviceType, isActive: true });
      if (!service) {
        return res.status(400).json({ success: false, message: 'Selected service is not available.' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create user with worker role
    const user = await User.create({
      name,
      email,
      password,
      role: 'worker',
      phone,
    });

    // Create worker profile
    const worker = await Worker.create({
      userId: user._id,
      serviceType,
      bio,
      experience: experience || 0,
      hourlyRate,
      location,
      requirementsFile: req.file.filename,
      status: 'pending',
      isApproved: false,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message:
        'Worker registration successful. Your application is under review. You will be notified once approved.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture,
        averageRating: user.averageRating,
        ratingCount: user.ratingCount,
      },
      worker: {
        _id: worker._id,
        serviceType: worker.serviceType,
        status: worker.status,
        isApproved: worker.isApproved,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const token = generateToken(user._id);

    // If worker, attach worker profile
    let workerProfile = null;
    if (user.role === 'worker') {
      workerProfile = await Worker.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
        averageRating: user.averageRating,
        ratingCount: user.ratingCount,
        createdAt: user.createdAt,
      },
      ...(workerProfile && { workerProfile }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let workerProfile = null;

    if (user.role === 'worker') {
      workerProfile = await Worker.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user,
      ...(workerProfile && { workerProfile }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update current user's profile picture
// @route   PUT /api/auth/profile-picture
// @access  Private
const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Profile picture is required.' });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const oldProfilePicture = currentUser.profilePicture;
    currentUser.profilePicture = req.file.filename;
    await currentUser.save();

    if (oldProfilePicture && oldProfilePicture.startsWith('profile-')) {
      const oldPath = path.join(__dirname, '../uploads', oldProfilePicture);
      fs.unlink(oldPath, (error) => {
        if (error && error.code !== 'ENOENT') {
          console.error('Failed to delete old profile picture:', error.message);
        }
      });
    }

    res.json({
      success: true,
      message: 'Profile picture updated successfully.',
      user: currentUser,
    });
  } catch (error) {
    next(error);
  }
};

// changePassword defined below

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    const user = await require('../models/User').findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, registerWorker, login, getMe, updateProfile, updateProfilePicture, changePassword };
