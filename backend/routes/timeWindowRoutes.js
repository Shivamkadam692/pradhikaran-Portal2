const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/timeWindowController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// Any authenticated user can view time windows
router.get('/', controller.list);

// Only pradhikaran can create/update/delete
router.post(
  '/',
  authorizeRoles(ROLES.PRADHIKARAN),
  [
    body('type').isIn(['question', 'answer']).withMessage('Type must be question or answer'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  authorizeRoles(ROLES.PRADHIKARAN),
  [
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.update
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.PRADHIKARAN),
  controller.remove
);

module.exports = router;
