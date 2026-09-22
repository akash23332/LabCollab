const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      default: function () {
        return `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      },
    },
    equipmentId: {
      type: String,
      index: true,
      trim: true,
      default: '',
    },
    equipmentName: {
      type: String,
      trim: true,
      default: 'Laboratory Instrument',
    },
    equipmentCategory: {
      type: String,
      default: '',
    },
    // User references
    user: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      default: null,
    },
    student: {
      name: { type: String, default: 'Student' },
      email: { type: String, default: '' },
      avatar: { type: String, default: '' },
      institution: { type: String, default: 'Chitkara University' },
      userId: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
    },
    // Equipment & Institution references
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
    college: {
      type: String,
      default: 'Chitkara University',
    },
    lab: {
      type: String,
      default: 'General Lab',
    },
    building: {
      type: String,
      default: 'Block A',
    },
    room: {
      type: String,
      default: '',
    },
    date: {
      type: mongoose.Schema.Types.Mixed, // Can be Date or String YYYY-MM-DD
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 2,
    },
    purpose: {
      type: String,
      default: 'Academic Research',
    },
    status: {
      type: String,
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'refunded'],
      default: 'unpaid',
    },
    isHistorical: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.pre('save', function (next) {
  if (this.totalPrice && !this.totalAmount) this.totalAmount = this.totalPrice;
  if (this.totalAmount && !this.totalPrice) this.totalPrice = this.totalAmount;
  if (!this.equipmentId && this.equipment) {
    this.equipmentId = this.equipment._id ? this.equipment._id.toString() : this.equipment.toString();
  }
  if (!this.student?.name && this.user?.name) {
    this.student = {
      name: this.user.name,
      email: this.user.email || '',
      avatar: this.user.avatar || '',
      institution: this.user.institution || this.college || '',
      userId: this.user._id || this.user,
    };
  }
  next();
});

bookingSchema.virtual('id').get(function () {
  return this.bookingId || this._id.toHexString();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
