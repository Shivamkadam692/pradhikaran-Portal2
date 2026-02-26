const questionService = require('../services/questionService');
const answerService = require('../services/answerService');
const activityLogService = require('../services/activityLogService');
const { ROLES, QUESTION_STATUS } = require('../config/constants');

const create = async (req, res, next) => {
  try {
    if (req.user.role === ROLES.PRADHIKARAN) {
      if (!req.body.department) {
        return res
          .status(400)
          .json({ success: false, message: 'Department is required when creating from Pradhikaran' });
      }
    }
    const payload = {
      title: req.body.title,
      description: req.body.description,
      department: req.body.department,
      deadline: req.body.deadline,
      priority: req.body.priority,
      tags: req.body.tags,
    };
    const service = req.user.role === ROLES.SENATE ? questionService.createFromSenate : questionService.create;
    const question = await service(payload, req.user._id);
    const populated = await question.populate('department', 'name email departmentName');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

const listMine = async (req, res, next) => {
  try {
    let list;
    if (req.user.role === ROLES.PRADHIKARAN) {
      list = await questionService.listForPradhikaran(req.user._id);
    } else if (req.user.role === ROLES.DEPARTMENT) {
      list = await questionService.listForDepartment(req.user._id);
    } else if (req.user.role === ROLES.SENATE) {
      list = await questionService.listForSenate(req.user._id);
    } else {
      list = [];
    }
    if (req.user.role === ROLES.DEPARTMENT && Array.isArray(list)) {
      list = list.map((q) => {
        const copy = { ...q };
        if (copy.finalAnswer) delete copy.finalAnswer;
        if (copy.finalAnswerPublishedAt) delete copy.finalAnswerPublishedAt;
        return copy;
      });
    }
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const question = await questionService.getById(req.params.id, {
      populateDepartment: true,
      populateCreatedBy: true,
      populateOwnerPradhikaran: true,
    });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    if (req.user.role === ROLES.DEPARTMENT) {
      if (question.finalAnswer) {
        delete question.finalAnswer;
      }
      if (question.finalAnswerPublishedAt) {
        delete question.finalAnswerPublishedAt;
      }
    }
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const question = await questionService.update(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        deadline: req.body.deadline,
        priority: req.body.priority,
        tags: req.body.tags,
      },
      req.user._id
    );
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found or not editable' });
    }
    const populated = await question.populate('department', 'name email departmentName');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

const lock = async (req, res, next) => {
  try {
    const question = await questionService.lock(req.params.id, req.user._id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found or not open' });
    }
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const question = await questionService.softDelete(req.params.id, req.user._id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found or not deletable' });
    }
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    next(err);
  }
};

const hardRemove = async (req, res, next) => {
  try {
    const result = await questionService.hardDelete(req.params.id, req.user._id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Question not found in trash or not deletable' });
    }
    res.json({ success: true, message: 'Question permanently deleted' });
  } catch (err) {
    next(err);
  }
};

const listTrashed = async (req, res, next) => {
  try {
    const list = await questionService.listTrashedForPradhikaran(req.user._id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const restore = async (req, res, next) => {
  try {
    const question = await questionService.restore(req.params.id, req.user._id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found in trash or not restorable' });
    }
    res.json({ success: true, message: 'Question restored successfully', data: question });
  } catch (err) {
    next(err);
  }
};
const getAnswers = async (req, res, next) => {
  try {
    const answers = await answerService.listByQuestion(req.params.id, req.user._id);
    if (answers === null) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.json({ success: true, data: answers });
  } catch (err) {
    next(err);
  }
};

const finalize = async (req, res, next) => {
  try {
    const { finalAnswer } = req.body;
    const question = await questionService.finalize(
      req.params.id,
      finalAnswer || '',
      req.user._id
    );
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: 'Question not found or already finalized' });
    }
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

const classify = async (req, res, next) => {
  try {
    const question = await questionService.classifyAndAssign(req.params.id, req.user._id, {
      departmentId: req.body.departmentId,
      priority: req.body.priority,
      tags: req.body.tags,
      note: req.body.note,
    });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found or not classifiable' });
    }
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

const listSenateInbox = async (req, res, next) => {
  try {
    const list = await questionService.listSenateInboxForPradhikaran();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const listAll = async (req, res, next) => {
  try {
    const list = await questionService.listAllForSuperAdmin();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const getFinalAnswerForSenate = async (req, res, next) => {
  try {
    const question = await questionService.getById(req.params.id);
    if (!question || question.status !== QUESTION_STATUS.FINALIZED || !question.finalAnswer) {
      return res.status(404).json({ success: false, message: 'Final answer not available' });
    }
    await activityLogService.logFinalAnswerViewed(req.user._id, req.params.id, {});
    res.json({
      success: true,
      data: {
        finalAnswer: question.finalAnswer,
        finalAnswerPublishedAt: question.finalAnswerPublishedAt,
        questionId: question._id,
        title: question.title,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  listMine,
  getOne,
  update,
  lock,
  remove,
  hardRemove,
  listTrashed,
  restore,
  getAnswers,
  finalize,
  classify,
  listSenateInbox,
  listAll,
  getFinalAnswerForSenate,
};
