const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: String,
      index: true,
      trim: true,
      default: function () {
        return `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      },
    },
    equipmentNumber: {
      type: String,
      trim: true,
      default: function () {
        return this.equipmentId;
      },
    },
    equipmentName: {
      type: String,
      trim: true,
      default: function () {
        return this.name || 'Laboratory Equipment';
      },
    },
    name: {
      type: String,
      trim: true,
      default: function () {
        return this.equipmentName || 'Laboratory Equipment';
      },
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
    capabilities: { type: [String], default: [] },
    applications: { type: [String], default: [] },
    experimentTypes: { type: [String], default: [] },
    sampleTypes: { type: [String], default: [] },
    measurements: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    institution: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
      ref: 'Institution',
      default: null,
    },
    collegeId: {
      type: String,
      default: 'Chitkara University',
      trim: true,
    },
    collegeName: {
      type: String,
      default: 'Chitkara University',
      trim: true,
    },
    labName: {
      type: String,
      default: 'General Lab',
      trim: true,
    },
    building: {
      type: String,
      default: 'Block A',
      trim: true,
    },
    roomNumber: {
      type: String,
      default: '',
      trim: true,
    },
    pricePerHour: {
      type: Number,
      default: 500,
      min: [0, 'Price per hour cannot be negative'],
    },
    price: {
      type: Number,
      default: 500,
    },
    priceLabel: {
      type: String,
      default: '₹500',
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    operator: {
      type: String,
      default: 'Self-Operated (Trained)',
    },
    locationStr: {
      type: String,
      default: 'Campus Lab',
    },
    location: {
      building: { type: String, default: 'Block A' },
      room: { type: String, default: '' },
      city: { type: String, default: 'Chandigarh' },
      state: { type: String, default: 'Punjab' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    state: {
      type: String,
      default: 'Punjab',
    },
    slotsToday: {
      type: [String],
      default: ['10:00 - 12:00', '14:00 - 16:00'],
    },
    tags: {
      type: [String],
      default: [],
    },
    visualType: {
      type: String,
      default: 'generic',
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'excellent', 'good', 'fair', 'poor'],
      default: 'Excellent',
    },
    maintenanceStatus: {
      type: String,
      default: 'Up to Date',
    },
    activeSessions: {
      type: Number,
      default: 0,
    },
    capacity: {
      type: String,
      default: '4 / 6 stations',
    },
    trainingRequired: { type: Boolean, default: false },
    certificationRequired: { type: Boolean, default: false },
    status: {
      type: String,
      default: 'Available',
    },
    availability: {
      type: String,
      default: 'Available',
    },
    isVerified: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
      ref: 'User',
      default: null,
    },
    demandPrediction: {
      predictedBookings: { type: Number, default: 0 },
      demandLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'low', 'medium', 'high'], default: 'LOW' },
      historicalAverage: { type: Number, default: 0 },
      predictionDate: { type: String, default: '' },
      lastSyncedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to synchronize equivalent fields
equipmentSchema.pre('save', function (next) {
  if (this.equipmentName && !this.name) this.name = this.equipmentName;
  if (this.name && !this.equipmentName) this.equipmentName = this.name;
  if (this.pricePerHour && !this.price) this.price = this.pricePerHour;
  if (this.price && !this.pricePerHour) this.pricePerHour = this.price;
  if (this.collegeName && !this.institution) this.institution = this.collegeName;
  if (!this.equipmentNumber) this.equipmentNumber = this.equipmentId;
  next();
});

// Virtuals for frontend & backward compatibility
equipmentSchema.virtual('id').get(function () {
  return this.equipmentId || this._id.toHexString();
});

equipmentSchema.virtual('title').get(function () {
  return this.equipmentName || this.name;
});

// Helper method to format this document for Semantic Search AI Model
equipmentSchema.methods.toAIModelFormat = function () {
  const specs = typeof this.specifications === 'object'
    ? JSON.stringify(this.specifications)
    : (this.specifications || '');

  return {
    equipment_id: this.equipmentId,
    equipment_name: this.equipmentName || this.name,
    category: this.category,
    description: this.description,
    capabilities: (this.capabilities || []).join(', '),
    applications: (this.applications || []).join(', '),
    experiment_types: (this.experimentTypes || []).join(', '),
    sample_types: (this.sampleTypes || []).join(', '),
    measurements: (this.measurements || []).join(', '),
    specifications: specs,
    keywords: (this.keywords || []).join(', '),
    college_name: this.collegeName || this.collegeId,
    lab_name: this.labName,
    building: this.building,
    room_number: this.roomNumber,
    status: (this.status || 'available').toLowerCase(),
    condition: (this.condition || 'excellent').toLowerCase(),
    search_text: [
      this.equipmentName || this.name,
      this.category,
      this.description,
      (this.capabilities || []).join(' '),
      (this.applications || []).join(' '),
      (this.keywords || []).join(' '),
    ].join(' '),
  };
};

equipmentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.equipmentId;
    if (!ret.equipmentName && ret.name) ret.equipmentName = ret.name;
    if (!ret.name && ret.equipmentName) ret.name = ret.equipmentName;
    if (!ret.price && ret.pricePerHour) ret.price = ret.pricePerHour;
    if (!ret.pricePerHour && ret.price) ret.pricePerHour = ret.price;
    delete ret.__v;
    return ret;
  },
});

const Equipment = mongoose.model('Equipment', equipmentSchema);
module.exports = Equipment;
