const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    institutionId: { type: String, sparse: true, trim: true },
    code: { type: String, sparse: true, trim: true },
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'university',
    },
    description: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: 'Chandigarh' },
    state: { type: String, trim: true, default: 'Punjab' },
    country: { type: String, trim: true, default: 'India' },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    isVerified: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

institutionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const Institution = mongoose.model('Institution', institutionSchema);
module.exports = Institution;
