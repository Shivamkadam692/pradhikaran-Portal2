const { User } = require('../models');
const { ROLES } = require('../config/constants');
const activityLogService = require('../services/activityLogService');
const { emit: socketEmit } = require('../utils/socketEmitter');
const { REGISTRATION_STATUS } = require('../config/constants');

const listPradhikaran = async (req, res, next) => {
  try {
    const users = await User.find({
      role: ROLES.PRADHIKARAN,
      isDeleted: { $ne: true },
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const createPradhikaran = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email, isDeleted: { $ne: true } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const user = new User({
      name,
      email,
      password: password || 'ChangeMe123!',
      role: ROLES.PRADHIKARAN,
      isApproved: true,
    });
    await user.save();
    
    // Log activity with error handling - don't fail the request if logging fails
    if (req.user?._id) {
      try {
        await activityLogService.logUserCreated(req.user._id, user._id, { email: user.email });
      } catch (logErr) {
        console.error('Failed to log user creation:', logErr);
      }
    }
    
    const userResponse = await User.findById(user._id).select('-password').lean();
    res.status(201).json({ success: true, data: userResponse });
  } catch (err) {
    next(err);
  }
};

const listDepartments = async (req, res, next) => {
  try {
    const filter = { role: ROLES.DEPARTMENT, isDeleted: { $ne: true } };
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const listSenate = async (req, res, next) => {
  try {
    const users = await User.find({
      role: ROLES.SENATE,
      isDeleted: { $ne: true },
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const createSenate = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email, isDeleted: { $ne: true } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const user = new User({
      name,
      email,
      password,
      role: ROLES.SENATE,
      isApproved: true,
    });
    await user.save();
    
    // Log activity with error handling - don't fail the request if logging fails
    if (req.user?._id) {
      try {
        await activityLogService.logUserCreated(req.user._id, user._id, { email: user.email, role: ROLES.SENATE });
      } catch (logErr) {
        console.error('Failed to log user creation:', logErr);
      }
    }
    
    const userResponse = await User.findById(user._id).select('-password').lean();
    res.status(201).json({ success: true, data: userResponse });
  } catch (err) {
    next(err);
  }
};

const listAuditors = async (req, res, next) => {
  try {
    const users = await User.find({
      role: ROLES.AUDITOR,
      isDeleted: { $ne: true },
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const createAuditor = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email, isDeleted: { $ne: true } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const user = new User({
      name,
      email,
      password,
      role: ROLES.AUDITOR,
      isApproved: true,
    });
    await user.save();
    if (req.user?._id) {
      try {
        await activityLogService.logUserCreated(req.user._id, user._id, { email: user.email, role: ROLES.AUDITOR });
      } catch (logErr) {
        console.error('Failed to log user creation:', logErr);
      }
    }
    const userResponse = await User.findById(user._id).select('-password').lean();
    res.status(201).json({ success: true, data: userResponse });
  } catch (err) {
    next(err);
  }
};

const approveDepartment = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.userId,
      role: ROLES.DEPARTMENT,
      isDeleted: { $ne: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    if (user.registrationRequest !== 'pending' || user.isApproved) {
      return res.status(400).json({ success: false, message: 'Registration is not pending approval' });
    }
    user.isApproved = true;
    user.registrationRequest = REGISTRATION_STATUS.APPROVED;
    user.registrationRejectionReason = undefined;
    await user.save();
    
    // Log activity with error handling - don't fail the request if logging fails
    if (req.user?._id) {
      try {
        await activityLogService.logRegistrationApproved(req.user._id, user._id, {
          email: user.email,
        });
      } catch (logErr) {
        console.error('Failed to log registration approval:', logErr);
      }
    }
    
    socketEmit('registrationApproved', { userId: user._id }, { userId: user._id.toString() });
    const userResponse = await User.findById(user._id).select('-password').lean();
    res.json({ success: true, data: userResponse });
  } catch (err) {
    next(err);
  }
};

const rejectDepartment = async (req, res, next) => {
  try {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason || reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required and must be at least 10 characters',
      });
    }
    const user = await User.findOne({
      _id: req.params.userId,
      role: ROLES.DEPARTMENT,
      isDeleted: { $ne: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    if (user.registrationRequest !== 'pending') {
      return res.status(400).json({ success: false, message: 'Registration is not pending' });
    }
    user.registrationRequest = REGISTRATION_STATUS.REJECTED;
    user.registrationRejectionReason = reason;
    user.isApproved = false;
    await user.save();
    
    // Log activity with error handling - don't fail the request if logging fails
    if (req.user?._id) {
      try {
        await activityLogService.logRegistrationRejected(req.user._id, user._id, {
          email: user.email,
          reason,
        });
      } catch (logErr) {
        console.error('Failed to log registration rejection:', logErr);
      }
    }
    
    socketEmit('registrationRejected', { userId: user._id, reason }, { userId: user._id.toString() });
    const userResponse = await User.findById(user._id).select('-password').lean();
    res.json({ success: true, data: userResponse });
  } catch (err) {
    next(err);
  }
};

const listPendingRegistrations = async (req, res, next) => {
  try {
    const users = await User.find({
      role: ROLES.DEPARTMENT,
      isApproved: false,
      registrationRequest: 'pending',
      isDeleted: { $ne: true },
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.userId,
      role: ROLES.DEPARTMENT,
      isDeleted: { $ne: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Department account not found' });
    }
    user.isDeleted = true;
    user.isApproved = false;
    await user.save();
    res.json({ success: true, message: 'Department account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPradhikaran,
  createPradhikaran,
  listDepartments,
  approveDepartment,
  rejectDepartment,
  listPendingRegistrations,
  listSenate,
  createSenate,
  listAuditors,
  createAuditor,
  deleteDepartment,
};
