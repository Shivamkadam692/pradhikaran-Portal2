const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

const createPradhikaranValidation = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 8 }),
];

router.use(authenticate);

router.get(
  '/pradhikaran',
  authorizeRoles(ROLES.SUPER_ADMIN),
  userController.listPradhikaran
);

router.post(
  '/pradhikaran',
  authorizeRoles(ROLES.SUPER_ADMIN),
  createPradhikaranValidation,
  validate,
  userController.createPradhikaran
);

router.get(
  '/departments',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRADHIKARAN),
  userController.listDepartments
);

router.get(
  '/pending-registrations',
  authorizeRoles(ROLES.PRADHIKARAN),
  userController.listPendingRegistrations
);

router.post(
  '/:userId/approve',
  authorizeRoles(ROLES.PRADHIKARAN),
  userController.approveDepartment
);

const rejectValidation = [
  body('reason').trim().isLength({ min: 10 }).withMessage('Rejection reason must be at least 10 characters'),
];

router.post(
  '/:userId/reject',
  authorizeRoles(ROLES.PRADHIKARAN),
  rejectValidation,
  validate,
  userController.rejectDepartment
);

module.exports = router;
