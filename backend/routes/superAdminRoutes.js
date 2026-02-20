const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const questionController = require('../controllers/questionController');
const analyticsController = require('../controllers/analyticsController');
const activityLogController = require('../controllers/activityLogController');
const exportController = require('../controllers/exportController');
const validate = require('../middleware/validate');

const router = express.Router();

const createPradhikaranValidation = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 8 }),
];

const createSenateValidation = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

router.get('/users/pradhikaran', userController.listPradhikaran);
router.post('/users/pradhikaran', createPradhikaranValidation, validate, userController.createPradhikaran);
router.get('/users/senate', userController.listSenate);
router.post('/users/senate', createSenateValidation, validate, userController.createSenate);
router.get('/users/pending-registrations', userController.listPendingRegistrations);
router.post('/users/:userId/approve', userController.approveDepartment);
router.get('/questions/all', questionController.listAll);
router.get('/analytics', analyticsController.getDashboard);
router.get('/activity-logs', activityLogController.list);
router.get('/export/question/:id', exportController.exportQuestion);
router.get('/export/department/:userId', exportController.exportDepartment);

module.exports = router;
