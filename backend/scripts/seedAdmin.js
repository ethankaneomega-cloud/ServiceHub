/**
 * ServiceHub - Admin Seeder
 * Run: node scripts/seedAdmin.js
 * 
 * Creates the default admin account.
 * Make sure MONGO_URI is set in .env before running.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');
};

const User = require('../models/User');

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ email: 'admin@servicehub.com' });
  if (existing) {
    console.log('⚠️  Admin already exists: admin@servicehub.com');
    process.exit(0);
  }

  const admin = await User.create({
    name: 'ServiceHub Admin',
    email: 'admin@servicehub.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  });

  console.log('🎉 Admin account created!');
  console.log('   Email:    admin@servicehub.com');
  console.log('   Password: admin123');
  console.log('   ID:      ', admin._id.toString());
  console.log('');
  console.log('⚠️  IMPORTANT: Change the password after first login!');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seeder error:', err.message);
  process.exit(1);
});
