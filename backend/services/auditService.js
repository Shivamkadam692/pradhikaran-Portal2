const { Question, User } = require('../models');
const { ROLES } = require('../config/constants');
const activityLogService = require('./activityLogService');
const { emit: socketEmit } = require('../utils/socketEmitter');

const listPending = async () => {
  const senateUsers = await User.find({ role: ROLES.SENATE, isDeleted: { $ne: true } })
    .select('_id')
    .lean();
  const senateIds = senateUsers.map((u) => u._id);
  if (senateIds.length === 0) return [];
  return Question.find({
    createdBy: { $in: senateIds },
    isDeleted: { $ne: true },
    auditStatus: 'pending',
  })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 })
    .lean();
};

const listApproved = async () => {
  return Question.find({
    isDeleted: { $ne: true },
    auditStatus: 'approved',
    ownerPradhikaran: { $exists: false },
  })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 })
    .lean();
};

const listDrafts = async () => {
  return Question.find({
    isDeleted: { $ne: true },
    auditStatus: 'rejected',
  })
    .populate('createdBy', 'name email role')
    .sort({ updatedAt: -1 })
    .lean();
};

const approve = async (questionId, auditorId, comment) => {
  const q = await Question.findOne({
    _id: questionId,
    isDeleted: { $ne: true },
    auditStatus: { $in: ['pending', 'rejected'] },
    ownerPradhikaran: { $exists: false },
  });
  if (!q) return null;
  q.auditStatus = 'approved';
  q.lastAuditedBy = auditorId;
  q.lastAuditedAt = new Date();
  q.auditTrail.push({
    action: 'approved',
    auditor: auditorId,
    comment: comment || '',
  });
  await q.save();
  await activityLogService.createLog({
    userId: auditorId,
    action: 'audit_approved',
    entityType: 'Question',
    entityId: q._id,
    metadata: { comment: comment || '' },
  });
  if (q.createdBy) {
    socketEmit('auditQuestionApproved', { questionId: q._id }, { userId: q.createdBy.toString() });
  }
  return q;
};

const reject = async (questionId, auditorId, reason) => {
  const q = await Question.findOne({
    _id: questionId,
    isDeleted: { $ne: true },
    auditStatus: { $in: ['pending', 'approved'] },
    ownerPradhikaran: { $exists: false },
  });
  if (!q) return null;
  q.auditStatus = 'rejected';
  q.lastAuditedBy = auditorId;
  q.lastAuditedAt = new Date();
  q.auditTrail.push({
    action: 'rejected',
    auditor: auditorId,
    comment: reason || '',
  });
  await q.save();
  await activityLogService.createLog({
    userId: auditorId,
    action: 'audit_rejected',
    entityType: 'Question',
    entityId: q._id,
    metadata: { reason: reason || '' },
  });
  if (q.createdBy) {
    socketEmit('auditQuestionRejected', { questionId: q._id, reason: reason || '' }, { userId: q.createdBy.toString() });
  }
  return q;
};

const resubmit = async (questionId, auditorId, comment) => {
  const q = await Question.findOne({
    _id: questionId,
    isDeleted: { $ne: true },
    auditStatus: 'rejected',
    ownerPradhikaran: { $exists: false },
  });
  if (!q) return null;
  q.auditStatus = 'pending';
  q.lastAuditedBy = auditorId;
  q.lastAuditedAt = new Date();
  q.auditTrail.push({
    action: 'resubmitted',
    auditor: auditorId,
    comment: comment || '',
  });
  await q.save();
  await activityLogService.createLog({
    userId: auditorId,
    action: 'audit_resubmitted',
    entityType: 'Question',
    entityId: q._id,
    metadata: { comment: comment || '' },
  });
  if (q.createdBy) {
    socketEmit('auditQuestionResubmitted', { questionId: q._id }, { userId: q.createdBy.toString() });
  }
  return q;
};

const forward = async (questionIds, auditorId) => {
  const updated = [];
  for (const id of questionIds) {
    const q = await Question.findOne({
      _id: id,
      isDeleted: { $ne: true },
      auditStatus: 'approved',
      ownerPradhikaran: { $exists: false },
    });
    if (!q) continue;
    q.auditStatus = 'forwarded';
    q.lastAuditedBy = auditorId;
    q.lastAuditedAt = new Date();
    q.auditTrail.push({
      action: 'forwarded',
      auditor: auditorId,
      comment: '',
    });
    await q.save();
    await activityLogService.createLog({
      userId: auditorId,
      action: 'audit_forwarded',
      entityType: 'Question',
      entityId: q._id,
      metadata: {},
    });
    updated.push(q._id.toString());
    if (q.createdBy) {
      socketEmit('auditQuestionForwarded', { questionId: q._id }, { userId: q.createdBy.toString() });
    }
    const pradhikaranUsers = await User.find({ role: ROLES.PRADHIKARAN, isDeleted: { $ne: true } }).select('_id').lean();
    for (const p of pradhikaranUsers) {
      socketEmit('auditQuestionForwarded', { questionId: q._id }, { userId: p._id.toString() });
    }
  }
  return updated;
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
