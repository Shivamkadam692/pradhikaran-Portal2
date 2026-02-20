const ActivityLog = require('../models/ActivityLog');
const { ACTIVITY_ACTIONS, ACTIVITY_STATUS } = require('../config/constants');

const createLog = async (data) => {
  const log = new ActivityLog({
    user: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    metadata: data.metadata || {},
    status: data.status ?? ACTIVITY_STATUS.SUCCESS,
  });
  await log.save();
  return log;
};

const logQuestionCreated = (userId, questionId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.QUESTION_CREATED,
    entityType: 'Question',
    entityId: questionId,
    metadata,
  });

const logQuestionUpdated = (userId, questionId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.QUESTION_UPDATED,
    entityType: 'Question',
    entityId: questionId,
    metadata,
  });

const logQuestionLocked = (userId, questionId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.QUESTION_LOCKED,
    entityType: 'Question',
    entityId: questionId,
    metadata,
  });

const logQuestionFinalized = (userId, questionId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.QUESTION_FINALIZED,
    entityType: 'Question',
    entityId: questionId,
    metadata,
  });

const logQuestionDeleted = (userId, questionId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.QUESTION_DELETED,
    entityType: 'Question',
    entityId: questionId,
    metadata,
  });

const logAnswerSubmitted = (userId, answerId, questionId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.ANSWER_SUBMITTED,
    entityType: 'Answer',
    entityId: answerId,
    metadata: { questionId, ...metadata },
  });

const logAnswerAccepted = (userId, answerId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.ANSWER_ACCEPTED,
    entityType: 'Answer',
    entityId: answerId,
    metadata,
  });

const logAnswerRejected = (userId, answerId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.ANSWER_REJECTED,
    entityType: 'Answer',
    entityId: answerId,
    metadata,
  });

const logUpdateRequested = (userId, answerId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.UPDATE_REQUESTED,
    entityType: 'Answer',
    entityId: answerId,
    metadata,
  });

const logFinalAnswerPublished = (userId, questionId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.FINAL_ANSWER_PUBLISHED,
    entityType: 'Question',
    entityId: questionId,
    metadata,
  });

const logFinalAnswerViewed = (userId, questionId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.FINAL_ANSWER_VIEWED,
    entityType: 'Question',
    entityId: questionId,
    metadata,
  });

const logRegistrationApproved = (userId, targetUserId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.REGISTRATION_APPROVED,
    entityType: 'User',
    entityId: targetUserId,
    metadata,
  });

const logRegistrationRejected = (userId, targetUserId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.REGISTRATION_REJECTED,
    entityType: 'User',
    entityId: targetUserId,
    metadata,
  });

const logUserCreated = (userId, targetUserId, metadata) =>
  createLog({
    userId,
    action: ACTIVITY_ACTIONS.USER_CREATED,
    entityType: 'User',
    entityId: targetUserId,
    metadata,
  });

module.exports = {
  createLog,
  logQuestionCreated,
  logQuestionUpdated,
  logQuestionLocked,
  logQuestionFinalized,
  logQuestionDeleted,
  logAnswerSubmitted,
  logAnswerAccepted,
  logAnswerRejected,
  logUpdateRequested,
  logFinalAnswerPublished,
  logFinalAnswerViewed,
  logRegistrationApproved,
  logRegistrationRejected,
  logUserCreated,
};
