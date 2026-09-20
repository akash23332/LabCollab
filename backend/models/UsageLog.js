const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: function () {
        return `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      },
    },
    booking: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Booking',
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      default: null,
    },
    equipment: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Equipment',
      default: null,
    },
    institution: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Institution',
      default: null,
    },
    equipmentId: {
      type: String,
      default: '',
    },
    equipmentName: {
      type: String,
      default: 'Laboratory Instrument',
    },
    equipmentNumber: {
      type: String,
      default: '',
    },
    userId: {
      type: String,
      default: '',
    },
    studentName: {
      type: String,
      default: 'Student User',
    },
    studentEmail: {
      type: String,
      default: '',
    },
    college: {
      type: String,
      default: 'Chitkara University',
    },
    lab: {
      type: String,
      default: 'General Lab',
    },
    department: {
      type: String,
      default: 'Engineering',
    },
    sessionType: {
      type: String,
      default: 'Research',
    },
    date: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new Date().toISOString().split('T')[0],
    },
    startTime: {
      type: String,
      default: '10:00',
    },
    endTime: {
      type: String,
      default: '12:00',
    },
    durationHours: {
      type: Number,
      default: 2,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    actualDurationMinutes: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      default: 'Completed',
    },
    cost: {
      type: Number,
      default: 500,
    },
    notes: {
      type: String,
      default: '',
    },
    operator: {
      type: String,
      default: 'Self-Operated',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

usageLogSchema.virtual('id').get(function () {
  return this.logId || this._id.toHexString();
});

const UsageLog = mongoose.model('UsageLog', usageLogSchema);
module.exports = UsageLog;
