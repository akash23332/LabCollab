const User = require('../models/User');

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution || '',
        phone: user.phone || '',
        location: user.location || {},
        requirements: user.requirements || [],
        isVerified: user.isVerified || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user's requirements and location
 * @route   PATCH /api/users/requirements
 * @access  Private
 */
const updateRequirements = async (req, res, next) => {
  try {
    const { requirements, location } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow updating requirements and location.
    // Forbidden fields (_id, email, password, role, isVerified) are strictly excluded.
    if (requirements !== undefined) {
      if (!Array.isArray(requirements)) {
        return res.status(400).json({ message: 'requirements must be an array of strings' });
      }
      user.requirements = requirements.map(String);
    }

    if (location !== undefined) {
      if (typeof location !== 'object' || location === null || Array.isArray(location)) {
        return res.status(400).json({ message: 'location must be an object' });
      }

      user.location = {
        city: location.city !== undefined ? String(location.city) : user.location.city,
        state: location.state !== undefined ? String(location.state) : user.location.state,
        latitude:
          location.latitude !== undefined ? Number(location.latitude) : user.location.latitude,
        longitude:
          location.longitude !== undefined ? Number(location.longitude) : user.location.longitude,
      };
    }

    await user.save();

    return res.status(200).json({
      message: 'User requirements updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution || '',
        phone: user.phone || '',
        location: user.location || {},
        requirements: user.requirements || [],
        isVerified: user.isVerified || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin only: Get all registered users (sorted newest first)
 * @route   GET /api/users/all
 * @access  Private / Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    const formattedUsers = users.map((u) => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      institution: u.institution || '',
      department: u.department || '',
      avatar: u.avatar || '',
      phone: u.phone || '',
      location: u.location || {},
      requirements: u.requirements || [],
      isVerified: u.isVerified || false,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return res.status(200).json({
      count: formattedUsers.length,
      users: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateRequirements,
  getAllUsers,
};
