const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');

const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Auth required'));
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('_id role').lean();
      if (!user) return next(new Error('User not found'));
      socket.userId = user._id.toString();
      socket.role = user.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('joinQuestion', (questionId) => {
      socket.join(`question:${questionId}`);
    });

    socket.on('leaveQuestion', (questionId) => {
      socket.leave(`question:${questionId}`);
    });

    socket.on('joinDepartment', (departmentId) => {
      socket.join(`department:${departmentId}`);
    });
  });

  const emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  const emitToQuestion = (questionId, event, data) => {
    io.to(`question:${questionId}`).emit(event, data);
  };

  const emitToDepartment = (departmentId, event, data) => {
    io.to(`department:${departmentId}`).emit(event, data);
  };

  const emitToAllDepartments = (event, data) => {
    io.emit(event, data);
  };

  return { io, emitToUser, emitToQuestion, emitToDepartment, emitToAllDepartments };
};

module.exports = { setupSocket };
