const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Service ID is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, 'Service ID can only contain lowercase letters, numbers, and underscores'],
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [80, 'Service name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
      maxlength: [300, 'Service description cannot exceed 300 characters'],
    },
    icon: {
      type: String,
      trim: true,
      default: '🛠️',
      maxlength: [8, 'Icon cannot exceed 8 characters'],
    },
    avgRate: {
      type: Number,
      required: [true, 'Average rate is required'],
      min: [0, 'Average rate cannot be negative'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
