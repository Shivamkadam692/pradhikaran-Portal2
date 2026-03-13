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

router.get(
  '/report-r1',
  authorizeRoles(ROLES.AUDITOR, ROLES.PRADHIKARAN),
  exportController.exportR1
);

router.get(
  '/report-r2',
  authorizeRoles(ROLES.AUDITOR, ROLES.PRADHIKARAN),
  exportController.exportR2
);

router.get(
  '/report-r3',
  authorizeRoles(ROLES.PRADHIKARAN),
  exportController.exportR3
);

router.get(
  '/report-r4',
  authorizeRoles(ROLES.PRADHIKARAN),
  exportController.exportR4
);

module.exports = router;


