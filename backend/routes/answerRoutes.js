const express = require('express');
const { body } = require('express-validator');
const answerController = require('../controllers/answerController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

const submitValidation = [
  body('questionId').isMongoId().withMessage('Valid question ID required'),
  body('content').trim().notEmpty().withMessage('Content required'),
];

const updateValidation = [body('content').trim().notEmpty().withMessage('Content required')];

const statusValidation = [
  body('status')
    .isIn(['accepted', 'rejected', 'update_requested'])
    .withMessage('Valid status required'),
  body('remark').optional().trim(),
];

router.use(authenticate);

router.post(
  '/',
  authorizeRoles(ROLES.DEPARTMENT),
  upload.array('attachments', 5), // Allow up to 5 files
  submitValidation,
  validate,
  answerController.submit
);

router.get(
  '/question/:questionId',
  authorizeRoles(ROLES.DEPARTMENT),
  answerController.getByQuestion
);

router
  .route('/:id')
  .get(answerController.getOne)
  .put(
    authorizeRoles(ROLES.DEPARTMENT),
    upload.array('attachments', 5), // Allow up to 5 files
    updateValidation,
    validate,
    answerController.updateContent
  );

router.post(
  '/:id/status',
  authorizeRoles(ROLES.PRADHIKARAN),
  statusValidation,
  validate,
  answerController.setStatus
);

module.exports = router;