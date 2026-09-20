const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    // Admin template fields
    equipmentId: {
      type: String,
      sparse: true,
      index: true,
      trim: true,
    },
    weeklyTemplate: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        default: [{ start: 8 * 60, end: 20 * 60, status: 'available' }],
      },
    },
    exceptions: [
      {
        id: { type: String, required: true },
        date: { type: String, required: true },
        start: { type: Number, required: true },
        end: { type: Number, required: true },
        status: {
          type: String,
          enum: ['blocked', 'maintenance', 'available'],
          default: 'blocked',
        },
        reason: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Individual slot fields (for collaborator tests and bookings)
    equipment: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Equipment',
      sparse: true,
      index: true,
    },
    date: {
      type: mongoose.Schema.Types.Mixed,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: 'available',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

availabilitySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const Availability = mongoose.model('Availability', availabilitySchema);
module.exports = Availability;
