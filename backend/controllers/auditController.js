const auditService = require('../services/auditService');

const listPending = async (req, res, next) => {
  try {
    const list = await auditService.listPending();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const listApproved = async (req, res, next) => {
  try {
    const list = await auditService.listApproved();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const listDrafts = async (req, res, next) => {
  try {
    const list = await auditService.listDrafts();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const approve = async (req, res, next) => {
  try {
    const q = await auditService.approve(req.params.id, req.user._id, req.body.comment);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found or not pending' });
    }
    res.json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason || reason.length < 5) {
      return res.status(400).json({ success: false, message: 'Reason must be at least 5 characters' });
    }
    const q = await auditService.reject(req.params.id, req.user._id, reason);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found or not approvable' });
    }
    res.json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

const resubmit = async (req, res, next) => {
  try {
    const q = await auditService.resubmit(req.params.id, req.user._id, req.body.comment);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found or not rejected' });
    }
    res.json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

const forward = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.questionIds) ? req.body.questionIds : [];
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions selected' });
    }
    const updatedIds = await auditService.forward(ids, req.user._id);
    res.json({ success: true, data: { forwarded: updatedIds } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPending,
  listApproved,
  listDrafts,
  approve,
  reject,
  resubmit,
  forward,
};
