let _io = null;
let _emitToUser = null;
let _emitToQuestion = null;
let _emitToDepartment = null;
let _emitToAll = null;

const setSocketHandlers = (handlers) => {
  _io = handlers.io;
  _emitToUser = handlers.emitToUser;
  _emitToQuestion = handlers.emitToQuestion;
  _emitToDepartment = handlers.emitToDepartment;
  _emitToAll = handlers.emitToAllDepartments;
};

const emit = (event, data, targets = {}) => {
  if (!_io) return;
  if (targets.userId) _emitToUser?.(targets.userId, event, data);
  if (targets.questionId) _emitToQuestion?.(targets.questionId, event, data);
  if (targets.departmentId) _emitToDepartment?.(targets.departmentId, event, data);
  if (targets.broadcast) _emitToAll?.(event, data);
};

module.exports = { setSocketHandlers, emit };
