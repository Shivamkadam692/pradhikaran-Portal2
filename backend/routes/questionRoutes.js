const express = require('express');
const { body, param } = require('express-validator');
const questionController = require('../controllers/questionController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

const createValidation = [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('department').optional().isMongoId().withMessage('Valid department ID required'),
  body('deadline').optional().isISO8601().withMessage('Valid date for deadline'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('tags').optional().isArray(),
];

const updateValidation = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('deadline').optional().isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('tags').optional().isArray(),
];

const finalizeValidation = [body('finalAnswer').optional().trim()];

router.use(authenticate);

router
  .route('/')
  .get(questionController.listMine)
  .post(
    authorizeRoles(ROLES.PRADHIKARAN, ROLES.SENATE),
    createValidation,
    validate,
    questionController.create
  );

router.get('/all', authorizeRoles(ROLES.SUPER_ADMIN), questionController.listAll);

router.get(
  '/senate-inbox',
  authorizeRoles(ROLES.PRADHIKARAN),
  questionController.listSenateInbox
);

router.get(
  '/trashed',
  authorizeRoles(ROLES.PRADHIKARAN),
  questionController.listTrashed
);

router.delete(
  '/:id/permanent',
  authorizeRoles(ROLES.PRADHIKARAN),
  questionController.hardRemove
);

router.post(
  '/:id/restore',
  authorizeRoles(ROLES.PRADHIKARAN),
  questionController.restore
);

router
  .route('/:id')
  .get(questionController.getOne)
  .put(
    authorizeRoles(ROLES.PRADHIKARAN),
    updateValidation,
    validate,
    questionController.update
  )
  .delete(authorizeRoles(ROLES.PRADHIKARAN), questionController.remove);

router.post(
  '/:id/lock',
  authorizeRoles(ROLES.PRADHIKARAN),
  questionController.lock
);

router.post(
  '/:id/classify',
  authorizeRoles(ROLES.PRADHIKARAN),
  [
    body('departmentId').optional().isMongoId().withMessage('Valid department ID required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('tags').optional().isArray(),
    body('note').optional().trim(),
  ],
  validate,
  questionController.classify
);

router.get(
  '/:id/answers',
  authorizeRoles(ROLES.PRADHIKARAN),
  questionController.getAnswers
);

router.post(
  '/:id/finalize',
  authorizeRoles(ROLES.PRADHIKARAN),
  finalizeValidation,
  validate,
  questionController.finalize
);

router.get(
  '/:id/final-answer',
  authorizeRoles(ROLES.SENATE),
  questionController.getFinalAnswerForSenate
);

module.exports = router;
