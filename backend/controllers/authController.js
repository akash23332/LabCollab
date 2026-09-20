const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a JWT for an authenticated user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, institution, role, phone } = req.body;

    // 1. Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // 2. Validate role & prevent public admin creation
    let assignedRole = 'student';
    if (role) {
      if (role === 'admin') {
        return res.status(400).json({ message: 'Admin registration is not permitted' });
      }
      if (!['student', 'faculty', 'lab_manager'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      assignedRole = role;
    }

    // 3. Prevent duplicate emails
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // 4. Create user (password is hashed in User pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
      institution: institution ? institution.trim() : '',
      phone: phone ? phone.trim() : '',
    });

    // 5. Generate JWT token
    const token = generateToken(user);

    // 6. Return response
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2. Find user by email (include password for bcrypt comparison)
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // 3. Check user existence and compare password
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Generate token
    const token = generateToken(user);

    // 5. Return user response without password
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  generateToken,
};
