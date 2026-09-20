const mongoose = require('mongoose');

/**
 * Phase 6 - physical usage record created by a QR check-in.
 *
 * A UsageLog is the *actual* usage of equipment; the Booking keeps the planned
 * window. The two are deliberately separate: planned duration is never
 * overwritten by actual usage.
 *
 * `booking` is unique, which is both the business rule ("one booking -> one
 * usage record") and the race-condition guard: two concurrent check-ins can
 * never create two active logs, the second insert fails on the unique index.
 *
 * Every timestamp is written by the backend. Nothing here is client-supplied.
 */
const usageLogSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
      unique: true,
    },
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
    checkInTime: {
      type: Date,
      required: [true, 'checkInTime is required'],
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    /** (checkOutTime - checkInTime) / 60000, calculated server side. */
    actualDurationMinutes: {
      type: Number,
      default: null,
      min: [0, 'actualDurationMinutes cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed'],
        message: 'status must be one of: active, completed',
      },
      default: 'active',
    },
    checkInMethod: {
      type: String,
      enum: { values: ['qr'], message: 'checkInMethod must be: qr' },
      default: 'qr',
    },
    checkOutMethod: {
      type: String,
      enum: { values: ['qr'], message: 'checkOutMethod must be: qr' },
      default: 'qr',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// `booking: { unique: true }` above is the enforcement (and the race guard) -
// no second index declaration here to avoid a duplicate index.

// "my usage history" and "my active session"
usageLogSchema.index({ user: 1, status: 1, checkInTime: -1 });

// equipment usage history + per-equipment analytics
usageLogSchema.index({ equipment: 1, checkInTime: -1 });
usageLogSchema.index({ equipment: 1, status: 1 });

// institution analytics
usageLogSchema.index({ institution: 1, checkInTime: -1 });

usageLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

usageLogSchema.set('toObject', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const UsageLog = mongoose.model('UsageLog', usageLogSchema);

/** Shared populate projections so user/booking data is never over-exposed. */
UsageLog.EQUIPMENT_FIELDS = 'name category pricePerHour location status isVerified institution';
UsageLog.INSTITUTION_FIELDS = 'name type city state isVerified';
UsageLog.USER_FIELDS = 'name email institution role';
UsageLog.BOOKING_FIELDS = 'date startTime endTime duration totalAmount purpose status';

module.exports = UsageLog;
