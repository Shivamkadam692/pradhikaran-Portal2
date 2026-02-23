const express = require('express');
const activityLogController = require('../controllers/activityLogController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN),
  activityLogController.list
);

router.get(
  '/mine',
  authorizeRoles(ROLES.PRADHIKARAN, ROLES.DEPARTMENT, ROLES.AUDITOR),
  activityLogController.listMine
);

router.get(
  '/mine/export',
  authorizeRoles(ROLES.PRADHIKARAN, ROLES.DEPARTMENT, ROLES.AUDITOR),
  activityLogController.exportMine
);

module.exports = router;
