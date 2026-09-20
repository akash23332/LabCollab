const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Equipment category is required'],
      trim: true,
    },
    description: { type: String, trim: true, default: '' },
    manufacturer: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: '' },
    specifications: { type: mongoose.Schema.Types.Mixed, default: {} },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution reference is required'],
    },
    pricePerHour: {
      type: Number,
      default: 0,
      min: [0, 'Price per hour cannot be negative'],
    },
    location: {
      building: { type: String, default: '' },
      room: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    trainingRequired: { type: Boolean, default: false },
    certificationRequired: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'decommissioned'],
      default: 'available',
    },
    isVerified: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

equipmentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Equipment', equipmentSchema);
