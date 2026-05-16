const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: [true, 'Worker is required'],
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true,
      lowercase: true,
    },
    scheduleDate: {
      type: Date,
      required: [true, 'Schedule date is required'],
    },
    scheduleTime: {
      type: String,
      required: [true, 'Schedule time is required'],
    },
    address: {
      type: String,
      required: [true, 'Service address is required'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    notes: {
      type: String,
    },
    cancelReason: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
    userRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    userReview: {
      type: String,
      trim: true,
      maxlength: [500, 'Review cannot exceed 500 characters'],
    },
    userRatedAt: {
      type: Date,
    },
    workerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    workerReview: {
      type: String,
      trim: true,
      maxlength: [500, 'Review cannot exceed 500 characters'],
    },
    workerRatedAt: {
      type: Date,
    },
    // Backward-compatible fields from the older one-way rating design.
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ workerId: 1, status: 1 });
bookingSchema.index({ scheduleDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
