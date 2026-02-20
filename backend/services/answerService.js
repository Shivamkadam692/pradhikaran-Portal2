const { Answer, Question } = require('../models');
const { QUESTION_STATUS, ANSWER_STATUS } = require('../config/constants');
const activityLogService = require('../services/activityLogService');
const { emit: socketEmit } = require('../utils/socketEmitter');
const fs = require('fs');
const path = require('path');

const submit = async (questionId, departmentId, content, userId, attachments = []) => {
  const question = await Question.findOne({
    _id: questionId,
    department: departmentId,
    isDeleted: { $ne: true },
    status: { $in: [QUESTION_STATUS.OPEN] },
  });
  if (!question) return { success: false, message: 'Question not found or not open' };
  let answer = await Answer.findOne({
    question: questionId,
    department: departmentId,
    isDeleted: { $ne: true },
  });
  if (answer) {
    return { success: false, message: 'One answer per question already submitted' };
  }
  answer = new Answer({
    question: questionId,
    department: departmentId,
    content,
    attachments,
    status: ANSWER_STATUS.PENDING_REVIEW,
  });
  await answer.save();
  await activityLogService.logAnswerSubmitted(userId, answer._id, questionId, { version: 1 });
  return { success: true, answer };
};

const updateContent = async (answerId, departmentId, content, userId, attachments = []) => {
  const answer = await Answer.findOne({
    _id: answerId,
    department: departmentId,
    isDeleted: { $ne: true },
  }).populate('question');
  if (!answer) return { success: false, message: 'Answer not found' };
  if (answer.question.status === QUESTION_STATUS.FINALIZED) {
    return { success: false, message: 'Question is finalized' };
  }
  if (answer.status !== ANSWER_STATUS.UPDATE_REQUESTED) {
    return { success: false, message: 'Update not requested' };
  }
  answer.previousVersions.push({
    content: answer.content,
    version: answer.version,
    submittedAt: new Date(),
  });
  answer.content = content;
  // Add new attachments to existing ones
  if (attachments && attachments.length > 0) {
    answer.attachments = [...answer.attachments, ...attachments];
  }
  answer.version += 1;
  answer.status = ANSWER_STATUS.PENDING_REVIEW;
  await answer.save();
  await activityLogService.logAnswerSubmitted(userId, answer._id, answer.question._id, {
    version: answer.version,
  });
  return { success: true, answer };
};

const setStatus = async (answerId, pradhikaranId, status, metadata = {}) => {
  const answer = await Answer.findOne({
    _id: answerId,
    isDeleted: { $ne: true },
  }).populate('question');
  if (!answer) return { success: false, message: 'Answer not found' };
  const ownerId = (answer.question.ownerPradhikaran || answer.question.createdBy).toString();
  if (ownerId !== pradhikaranId.toString()) {
    return { success: false, message: 'Not authorized' };
  }
  if (answer.question.status === QUESTION_STATUS.FINALIZED) {
    return { success: false, message: 'Question is finalized' };
  }
  const validStatuses = [
    ANSWER_STATUS.ACCEPTED,
    ANSWER_STATUS.REJECTED,
    ANSWER_STATUS.UPDATE_REQUESTED,
  ];
  if (!validStatuses.includes(status)) {
    return { success: false, message: 'Invalid status' };
  }
  answer.status = status;
  await answer.save();
  
  // Fetch the updated answer with necessary population
  const updatedAnswer = await Answer.findById(answer._id)
    .populate('question')
    .populate('department', 'name email departmentName');
    
  if (status === ANSWER_STATUS.ACCEPTED) {
    await activityLogService.logAnswerAccepted(pradhikaranId, answer._id, metadata);
  } else if (status === ANSWER_STATUS.REJECTED) {
    await activityLogService.logAnswerRejected(pradhikaranId, answer._id, metadata);
  } else {
    await activityLogService.logUpdateRequested(pradhikaranId, answer._id, metadata);
  }
  const depId = updatedAnswer.department?._id?.toString?.() || updatedAnswer.department?.toString?.() || '';
  socketEmit('answerStatusChanged', { answerId: updatedAnswer._id, status }, {
    questionId: updatedAnswer.question._id.toString(),
    ...(depId && { departmentId: depId }),
  });
  return { success: true, answer: updatedAnswer };
};

const listByQuestion = async (questionId, pradhikaranId) => {
  const question = await Question.findOne({
    _id: questionId,
    $or: [
      { ownerPradhikaran: pradhikaranId },
      { ownerPradhikaran: { $exists: false }, createdBy: pradhikaranId },
    ],
    isDeleted: { $ne: true },
  });
  if (!question) return null;
  return Answer.find({ question: questionId, isDeleted: { $ne: true } })
    .populate('department', 'name email departmentName')
    .sort({ createdAt: -1 })
    .lean();
};

const getByQuestionAndDepartment = async (questionId, departmentId) => {
  return Answer.findOne({
    question: questionId,
    department: departmentId,
    isDeleted: { $ne: true },
  })
    .populate('question')
    .lean();
};

const getById = async (id) => {
  return Answer.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate('question')
    .populate('department', 'name email departmentName')
    .lean();
};

// Function to add attachments to an answer
const addAttachments = async (answerId, departmentId, attachments) => {
  const answer = await Answer.findOne({
    _id: answerId,
    department: departmentId,
    isDeleted: { $ne: true },
  });
  
  if (!answer) return { success: false, message: 'Answer not found' };
  
  // Add new attachments to existing ones
  answer.attachments = [...answer.attachments, ...attachments];
  await answer.save();
  
  return { success: true, answer };
};

module.exports = {
  submit,
  updateContent,
  setStatus,
  listByQuestion,
  getByQuestionAndDepartment,
  getById,
  addAttachments,
};
