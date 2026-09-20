const mongoose = require('mongoose');

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Store one booking day as UTC midnight so "one date" === "one Date value". */
const toUTCDay = (value) => {
  if (!value) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment is required'],
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution is required'],
    },
    availability: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Availability',
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      set: toUTCDay,
    },
    startTime: {
      type: String,
      required: [true, 'startTime is required'],
      trim: true,
      validate: {
        validator: (value) => HH_MM.test(value),
        message: 'startTime must be a valid 24-hour time in HH:mm format',
      },
    },
    endTime: {
      type: String,
      required: [true, 'endTime is required'],
      trim: true,
      validate: {
        validator: (value) => HH_MM.test(value),
        message: 'endTime must be a valid 24-hour time in HH:mm format',
      },
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0, 'Duration cannot be negative'],
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
        message: 'Status must be one of: pending, approved, rejected, cancelled, completed',
      },
      default: 'pending',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
        message: 'paymentStatus must be one of: unpaid, pending, paid, failed, refunded',
      },
      default: 'unpaid',
    },
  },
  {
    timestamps: true,
  }
);

// Schema-level pre-validation check: startTime must be earlier than endTime
bookingSchema.pre('validate', function checkTimes(next) {
  if (
    this.startTime &&
    this.endTime &&
    HH_MM.test(this.startTime) &&
    HH_MM.test(this.endTime) &&
    this.startTime >= this.endTime
  ) {
    this.invalidate('endTime', 'endTime must be later than startTime', this.endTime);
  }
  return next();
});

// Indexes to support fast double-booking conflict queries and user dashboard lookups
bookingSchema.index({ equipment: 1, date: 1, status: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ institution: 1, status: 1 });

bookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

bookingSchema.set('toObject', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
