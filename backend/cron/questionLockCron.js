const cron = require('node-cron');
const { Question } = require('../models');
const { QUESTION_STATUS } = require('../config/constants');
const activityLogService = require('../services/activityLogService');

let io = null;

const setIo = (socketIo) => {
  io = socketIo;
};

const runLockOverdue = async () => {
  const now = new Date();
  const updated = await Question.updateMany(
    {
      status: QUESTION_STATUS.OPEN,
      deadline: { $lt: now },
      isDeleted: { $ne: true },
    },
    { $set: { status: QUESTION_STATUS.LOCKED } }
  );
  if (updated.modifiedCount > 0) {
    const questions = await Question.find({
      status: QUESTION_STATUS.LOCKED,
      deadline: { $lt: now },
    }).lean();
    for (const q of questions) {
      await activityLogService.createLog({
        userId: null,
        action: 'question_locked',
        entityType: 'Question',
        entityId: q._id,
        metadata: { reason: 'deadline_passed' },
      });
      if (io) {
        io.to(`question:${q._id}`).emit('questionLocked', { questionId: q._id });
        if (q.department) {
          io.to(`department:${q.department}`).emit('questionLocked', { questionId: q._id });
        }
      }
    }
  }
};

const start = () => {
  cron.schedule('*/5 * * * *', runLockOverdue);
  console.log('Cron: question lock by deadline every 5 minutes');
};

module.exports = { start, setIo, runLockOverdue };
