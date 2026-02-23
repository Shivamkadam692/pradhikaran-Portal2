const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/auditController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.AUDITOR));

router.get('/pending', controller.listPending);
router.get('/approved', controller.listApproved);
router.get('/drafts', controller.listDrafts);

router.post(
  '/:id/approve',
  [body('comment').optional().trim()],
  validate,
  controller.approve
);
router.post(
  '/:id/reject',
  [body('reason').trim().isLength({ min: 5 })],
  validate,
  controller.reject
);
router.post(
  '/:id/resubmit',
  [body('comment').optional().trim()],
  validate,
  controller.resubmit
);
router.post(
  '/forward',
  [body('questionIds').isArray({ min: 1 }).withMessage('questionIds must be a non-empty array')],
  validate,
  controller.forward
);

module.exports = router;
