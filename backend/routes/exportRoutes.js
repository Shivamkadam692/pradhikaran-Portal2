const express = require('express');
const exportController = require('../controllers/exportController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();
router.use(authenticate);

router.get(
  '/question/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRADHIKARAN, ROLES.DEPARTMENT),
  exportController.exportQuestion
);

router.get(
  '/department/:userId',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRADHIKARAN, ROLES.DEPARTMENT),
  exportController.exportDepartment
);

module.exports = router;
