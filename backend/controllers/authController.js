const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ROLES, ALLOWED_DEPARTMENT_NAMES } = require('../config/constants');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.role === ROLES.DEPARTMENT) {
      if (!user.isApproved) {
        return res.status(403).json({ success: false, message: 'Registration pending approval' });
      }
      if (!user.password) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const match = await user.comparePassword(password);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      if (!user.password) {
        return res.status(401).json({ success: false, message: 'Account has no password set. Contact admin.' });
      }
      const match = await user.comparePassword(password);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }
    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const userResponse = await User.findById(user._id).select('-password').lean();
    res.json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }
    const decoded = verifyRefreshToken(token);
    const user = await User.findOne({
      _id: decoded.userId,
      isDeleted: { $ne: true },
    }).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (user.role === ROLES.DEPARTMENT && !user.isApproved) {
      return res.status(403).json({ success: false, message: 'Account pending approval' });
    }
    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const userResponse = user.toObject ? user.toObject() : user;
    res.json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
      },
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token. Please sign in again.' });
    }
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out' });
};

const registerDepartment = async (req, res, next) => {
  try {
    const { name, email, password, departmentName } = req.body;
    const trimmedDept = typeof departmentName === 'string' ? departmentName.trim() : '';
    if (!trimmedDept) {
      return res.status(400).json({ success: false, message: 'Department selection is required' });
    }
    if (!ALLOWED_DEPARTMENT_NAMES.includes(trimmedDept)) {
      return res.status(400).json({
        success: false,
        message: `Department must be one of: ${ALLOWED_DEPARTMENT_NAMES.join(', ')}`,
      });
    }
    const existing = await User.findOne({ email, isDeleted: { $ne: true } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = new User({
      name,
      email,
      password,
      departmentName: trimmedDept,
      role: ROLES.DEPARTMENT,
      isApproved: false,
      registrationRequest: 'pending',
    });
    await user.save();
    const userResponse = await User.findById(user._id).select('-password').lean();
    res.status(201).json({
      success: true,
      message: 'Registration submitted. You can login after approval.',
      data: { user: userResponse },
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  registerDepartment,
  me,
};
