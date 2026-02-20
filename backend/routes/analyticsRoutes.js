const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();
router.use(authenticate);
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRADHIKARAN),
  analyticsController.getDashboard
);

module.exports = router;
