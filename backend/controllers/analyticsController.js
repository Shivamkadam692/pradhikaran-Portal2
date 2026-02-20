const { Question, Answer, User, ActivityLog } = require('../models');
const { ROLES, QUESTION_STATUS, ANSWER_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

const getDashboard = async (req, res, next) => {
  try {
    const baseMatch = { isDeleted: { $ne: true } };

    const [
      totalQuestions,
      totalAnswers,
      pendingReviews,
      approvedRegistrations,
      lockedQuestions,
      openQuestions,
      finalizedQuestions,
    ] = await Promise.all([
      Question.countDocuments(baseMatch),
      Answer.countDocuments(baseMatch),
      Answer.countDocuments({ ...baseMatch, status: ANSWER_STATUS.PENDING_REVIEW }),
      User.countDocuments({ role: ROLES.DEPARTMENT, isApproved: true, ...baseMatch }),
      Question.countDocuments({ ...baseMatch, status: QUESTION_STATUS.LOCKED }),
      Question.countDocuments({ ...baseMatch, status: QUESTION_STATUS.OPEN }),
      Question.countDocuments({ ...baseMatch, status: QUESTION_STATUS.FINALIZED }),
    ]);

    const monthlyTrends = await Question.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        totalQuestions,
        totalAnswers,
        pendingReviews,
        approvedRegistrations,
        lockedQuestions,
        openQuestions,
        finalizedQuestions,
        monthlyTrends,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
