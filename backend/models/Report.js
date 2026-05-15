const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    reporterRole: {
      type: String,
      enum: ['user', 'worker'],
      required: [true, 'Reporter role is required'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reportedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    category: {
      type: String,
      enum: [
        'booking_issue',
        'payment_issue',
        'worker_conduct',
        'client_conduct',
        'service_quality',
        'safety',
        'app_issue',
        'other',
      ],
      default: 'other',
      required: [true, 'Category is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [5, 'Subject must be at least 5 characters'],
      maxlength: [120, 'Subject cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'dismissed'],
      default: 'open',
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin response cannot exceed 1000 characters'],
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ reporterId: 1, status: 1 });
reportSchema.index({ reporterRole: 1, status: 1 });
reportSchema.index({ bookingId: 1 });
reportSchema.index({ status: 1, priority: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
