const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Institution type is required'],
      enum: ['university', 'college', 'research_lab', 'private_lab'],
    },
    description: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    isVerified: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

module.exports = mongoose.model('Institution', institutionSchema);
