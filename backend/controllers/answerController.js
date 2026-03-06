const answerService = require('../services/answerService');
const { QUESTION_STATUS } = require('../config/constants');
const TimeWindow = require('../models/TimeWindow');
const path = require('path');

const submit = async (req, res, next) => {
  try {
    // Enforce time window for answer submission
    const now = new Date();
    const activeWindow = await TimeWindow.findOne({
      type: 'answer',
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    if (!activeWindow) {
      return res.status(403).json({
        success: false,
        message: 'Answer submission is not open at this time. Please check the active time window.',
      });
    }

    // Process uploaded files if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: path.join('uploads', file.filename)
        });
      }
    }
    
    const result = await answerService.submit(
      req.body.questionId,
      req.user._id,
      req.body.content,
      req.user._id,
      attachments
    );
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    const populated = await result.answer.populate('question', 'title status');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

const updateContent = async (req, res, next) => {
  try {
    // Process uploaded files if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: path.join('uploads', file.filename)
        });
      }
    }
    
    const result = await answerService.updateContent(
      req.params.id,
      req.user._id,
      req.body.content,
      req.user._id,
      attachments
    );
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    const populated = await result.answer.populate('question', 'title status');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

const setStatus = async (req, res, next) => {
  try {
    const { status, remark } = req.body;
    const result = await answerService.setStatus(
      req.params.id,
      req.user._id,
      status,
      { remark }
    );
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, data: result.answer });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const answer = await answerService.getById(req.params.id);
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }
    res.json({ success: true, data: answer });
  } catch (err) {
    next(err);
  }
};

const getByQuestion = async (req, res, next) => {
  try {
    const answer = await answerService.getByQuestionAndDepartment(
      req.params.questionId,
      req.user._id
    );
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }
    res.json({ success: true, data: answer });
  } catch (err) {
    next(err);
  }
};

const listByDepartment = async (req, res, next) => {
  try {
    const answers = await answerService.listByDepartment(req.params.departmentId);
    res.json({ success: true, data: answers });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submit,
  updateContent,
  setStatus,
  getOne,
  getByQuestion,
  listByDepartment,
};
