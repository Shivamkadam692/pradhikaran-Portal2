const { User } = require('../models');
const { verifyAccessToken } = require('../utils/jwt');
const { ROLES } = require('../config/constants');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }
    const decoded = verifyAccessToken(token);
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
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles };
