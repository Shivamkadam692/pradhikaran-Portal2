const { ROLES } = require('../config/constants');

const SUPER_ADMIN_PATH = process.env.SUPER_ADMIN_SECRET_PATH || 'super-admin-secure';

const superAdminRoute = (req, res, next) => {
  const pathSecret = req.query.access || req.headers['x-super-admin-access'];
  if (pathSecret !== SUPER_ADMIN_PATH) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  if (req.user && req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden' });
};

const requireSuperAdminPath = (req, res, next) => {
  const pathSecret = req.query.access || req.headers['x-super-admin-access'];
  if (pathSecret !== SUPER_ADMIN_PATH) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  next();
};

module.exports = { superAdminRoute, requireSuperAdminPath };
