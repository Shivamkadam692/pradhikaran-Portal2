const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  authorizeRoles(ROLES.PRADHIKARAN),
  reportController.listReports
);

router.get(
  '/:id/download',
  authorizeRoles(ROLES.PRADHIKARAN),
  reportController.downloadReport
);

module.exports = router;
