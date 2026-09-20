const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'faculty', 'lab_manager', 'admin', 'technician'],
        message: 'Role must be student, faculty, lab_manager, admin, or technician',
      },
      default: 'student',
    },
    institution: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    requirements: {
      type: [String],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Ensure password and internal fields are never exposed in JSON output
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
