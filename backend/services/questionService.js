const { Question, Answer, User } = require('../models');
const { QUESTION_STATUS, ANSWER_STATUS, ROLES } = require('../config/constants');
const activityLogService = require('../services/activityLogService');
const { emit: socketEmit } = require('../utils/socketEmitter');

const create = async (data, userId) => {
  const question = new Question({
    title: data.title,
    description: data.description,
    department: data.department,
    createdBy: userId,
    ownerPradhikaran: userId,
    status: QUESTION_STATUS.OPEN,
    priority: data.priority || 'medium',
    tags: data.tags || [],
    deadline: data.deadline,
  });
  await question.save();
  await activityLogService.logQuestionCreated(userId, question._id, {
    title: question.title,
    sourceRole: ROLES.PRADHIKARAN,
  });
  return question;
};

const createFromSenate = async (data, userId) => {
  const question = new Question({
    title: data.title,
    description: data.description,
    createdBy: userId,
    status: QUESTION_STATUS.OPEN,
    auditStatus: 'pending',
    priority: data.priority || 'medium',
    tags: data.tags || [],
    deadline: data.deadline,
  });
  await question.save();
  await activityLogService.logQuestionCreated(userId, question._id, {
    title: question.title,
    sourceRole: ROLES.SENATE,
  });
  const pradhikaranUsers = await User.find({
    role: ROLES.PRADHIKARAN,
    isDeleted: { $ne: true },
  })
    .select('_id')
    .lean();
  for (const p of pradhikaranUsers) {
    socketEmit(
      'senateQuestionCreated',
      { questionId: question._id },
      { userId: p._id.toString() }
    );
  }
  return question;
};

const listForPradhikaran = async (userId) => {
  return Question.find({
    isDeleted: { $ne: true },
    $or: [
      { ownerPradhikaran: userId },
      { ownerPradhikaran: { $exists: false }, createdBy: userId },
    ],
  })
    .populate('department', 'name email departmentName')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 })
    .lean();
};

const listForSenate = async (userId) => {
  return Question.find({
    createdBy: userId,
    isDeleted: { $ne: true },
  })
    .populate('department', 'name email departmentName')
    .populate('ownerPradhikaran', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

const listForDepartment = async (departmentId) => {
  return Question.find({
    department: departmentId,
    isDeleted: { $ne: true },
  })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

const getById = async (id, options = {}) => {
  const q = Question.findOne({ _id: id, isDeleted: { $ne: true } });
  if (options.populateDepartment) q.populate('department', 'name email departmentName');
  if (options.populateCreatedBy) q.populate('createdBy', 'name email role');
  if (options.populateOwnerPradhikaran) q.populate('ownerPradhikaran', 'name email');
  return q.lean();
};

const update = async (id, data, userId) => {
  const question = await Question.findOne({
    _id: id,
    isDeleted: { $ne: true },
    status: { $in: [QUESTION_STATUS.OPEN, QUESTION_STATUS.LOCKED] },
    $or: [
      { ownerPradhikaran: userId },
      { ownerPradhikaran: { $exists: false }, createdBy: userId },
    ],
  });
  if (!question) return null;
  const old = { title: question.title, description: question.description };
  if (data.title != null) question.title = data.title;
  if (data.description != null) question.description = data.description;
  if (data.deadline != null) question.deadline = data.deadline;
  if (data.priority != null) question.priority = data.priority;
  if (Array.isArray(data.tags)) question.tags = data.tags;
  await question.save();
  await activityLogService.logQuestionUpdated(userId, question._id, { old, new: data });
  return question;
};

const lock = async (id, userId) => {
  const question = await Question.findOne({
    _id: id,
    isDeleted: { $ne: true },
    status: QUESTION_STATUS.OPEN,
    $or: [
      { ownerPradhikaran: userId },
      { ownerPradhikaran: { $exists: false }, createdBy: userId },
    ],
  });
  if (!question) return null;
  await question.save();
  question.status = QUESTION_STATUS.LOCKED;
  await question.save();
  await activityLogService.logQuestionLocked(userId, question._id, {});
  const departmentId = question.department ? question.department.toString() : null;
  socketEmit(
    'questionLocked',
    { questionId: question._id },
    {
      questionId: question._id.toString(),
      ...(departmentId && { departmentId }),
    }
  );
  return question;
};

const softDelete = async (id, userId) => {
  const question = await Question.findOne({
    _id: id,
    isDeleted: { $ne: true },
    status: { $in: [QUESTION_STATUS.OPEN] },
    $or: [
      { ownerPradhikaran: userId },
      { ownerPradhikaran: { $exists: false }, createdBy: userId },
    ],
  });
  if (!question) return null;
  question.isDeleted = true;
  await question.save();
  await activityLogService.logQuestionDeleted(userId, question._id, { title: question.title });
  return question;
};

const hardDelete = async (id, userId) => {
  const question = await Question.findOne({
    _id: id,
    isDeleted: true,
    $or: [
      { ownerPradhikaran: userId },
      { ownerPradhikaran: { $exists: false }, createdBy: userId },
    ],
  });
  if (!question) return null;
  await Question.deleteOne({ _id: id });
  await activityLogService.logQuestionDeleted(userId, id, { permanent: true });
  return { _id: id };
};

const listTrashedForPradhikaran = async (userId) => {
  return Question.find({
    isDeleted: true,
    $or: [
      { ownerPradhikaran: userId },
      { ownerPradhikaran: { $exists: false }, createdBy: userId },
    ],
  })
    .populate('department', 'name email departmentName')
    .populate('createdBy', 'name email role')
    .sort({ updatedAt: -1 })
    .lean();
};

const finalize = async (id, finalAnswerText, userId) => {
  const question = await Question.findOne({
    _id: id,
    isDeleted: { $ne: true },
    status: { $in: [QUESTION_STATUS.OPEN, QUESTION_STATUS.LOCKED] },
    $or: [
      { ownerPradhikaran: userId },
      { ownerPradhikaran: { $exists: false }, createdBy: userId },
    ],
  });
  if (!question) return null;
  question.finalAnswer = finalAnswerText;
  question.status = QUESTION_STATUS.FINALIZED;
  question.finalAnswerPublishedAt = new Date();
  await question.save();
  await activityLogService.logQuestionFinalized(userId, question._id, {});
  await activityLogService.logFinalAnswerPublished(userId, question._id, {});
  if (question.createdBy) {
    socketEmit(
      'senateFinalAnswerAvailable',
      { questionId: question._id, url: `/senate/question/${question._id.toString()}` },
      { userId: question.createdBy.toString() }
    );
  }
  return question;
};

const classifyAndAssign = async (id, pradhikaranId, data) => {
  const question = await Question.findOne({
    _id: id,
    isDeleted: { $ne: true },
    status: { $in: [QUESTION_STATUS.OPEN, QUESTION_STATUS.LOCKED] },
  });
  if (!question) return null;
  const old = {
    department: question.department,
    priority: question.priority,
    tags: question.tags,
    ownerPradhikaran: question.ownerPradhikaran,
  };
  question.ownerPradhikaran = pradhikaranId;
  if (data.departmentId) question.department = data.departmentId;
  if (data.priority) question.priority = data.priority;
  if (Array.isArray(data.tags)) question.tags = data.tags;
  question.classificationHistory.push({
    classifiedBy: pradhikaranId,
    department: data.departmentId || question.department,
    priority: data.priority || question.priority,
    tags: Array.isArray(data.tags) ? data.tags : question.tags,
    note: data.note,
  });
  await question.save();
  await activityLogService.logQuestionUpdated(pradhikaranId, question._id, {
    old,
    new: {
      department: question.department,
      priority: question.priority,
      tags: question.tags,
      ownerPradhikaran: question.ownerPradhikaran,
    },
    classification: true,
  });
  if (question.department) {
    socketEmit(
      'questionAssigned',
      { questionId: question._id, departmentId: question.department },
      { departmentId: question.department.toString() }
    );
  }
  if (question.createdBy) {
    socketEmit(
      'questionClassified',
      { questionId: question._id, departmentId: question.department },
      { userId: question.createdBy.toString() }
    );
  }
  return question;
};

const listSenateInboxForPradhikaran = async () => {
  const senateUsers = await User.find({
    role: ROLES.SENATE,
    isDeleted: { $ne: true },
  })
    .select('_id')
    .lean();
  const senateIds = senateUsers.map((u) => u._id);
  if (senateIds.length === 0) return [];
  return Question.find({
    createdBy: { $in: senateIds },
    isDeleted: { $ne: true },
    ownerPradhikaran: { $exists: false },
    auditStatus: 'forwarded',
  })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 })
    .lean();
};

const listAllForSuperAdmin = async () => {
  return Question.find({ isDeleted: { $ne: true } })
    .populate('department', 'name email departmentName')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = {
  create,
  createFromSenate,
  listForPradhikaran,
  listForDepartment,
  listForSenate,
  getById,
  update,
  lock,
  softDelete,
  finalize,
  listAllForSuperAdmin,
  classifyAndAssign,
  listSenateInboxForPradhikaran,
  hardDelete,
  listTrashedForPradhikaran,
};
