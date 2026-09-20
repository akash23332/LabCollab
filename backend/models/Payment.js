const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: false,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    provider: {
      type: String,
      default: 'razorpay',
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },
    signature: {
      type: String,
      default: null,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['created', 'pending', 'paid', 'failed', 'refunded'],
        message: 'Status must be one of: created, pending, paid, failed, refunded',
      },
      default: 'created',
      index: true,
    },
    method: {
      type: String,
      default: null,
    },
    errorDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre('validate', function (next) {
  if (this.razorpayOrderId && !this.orderId) {
    this.orderId = this.razorpayOrderId;
  }
  if (this.orderId && !this.razorpayOrderId) {
    this.razorpayOrderId = this.orderId;
  }
  if (this.razorpayPaymentId && !this.paymentId) {
    this.paymentId = this.razorpayPaymentId;
  }
  if (this.paymentId && !this.razorpayPaymentId) {
    this.razorpayPaymentId = this.paymentId;
  }
  if (this.razorpaySignature && !this.signature) {
    this.signature = this.razorpaySignature;
  }
  if (this.signature && !this.razorpaySignature) {
    this.razorpaySignature = this.signature;
  }
  next();
});

// Indexes
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

paymentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

paymentSchema.set('toObject', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
