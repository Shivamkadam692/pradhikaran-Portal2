require('dotenv').config();
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { setupSocket } = require('./sockets');
const { setSocketHandlers } = require('./utils/socketEmitter');
const questionLockCron = require('./cron/questionLockCron');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const exportRoutes = require('./routes/exportRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const auditRoutes = require('./routes/auditRoutes');
const reportRoutes = require('./routes/reportRoutes');
const timeWindowRoutes = require('./routes/timeWindowRoutes');
const { authenticate } = require('./middleware/auth');
const { superAdminRoute, requireSuperAdminPath } = require('./middleware/superAdminRoute');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

const isDev = process.env.NODE_ENV !== 'production';
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: isDev ? 100 : Number(process.env.RATE_LIMIT_MAX_AUTH) || 20,
  message: { success: false, message: 'Too many attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: isDev ? 500 : Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/time-windows', timeWindowRoutes);

app.get('/api/super-admin/health', requireSuperAdminPath, (req, res) => {
  res.json({ success: true, message: 'Super Admin route accessible' });
});

app.use('/api/super-admin', requireSuperAdminPath, authenticate, superAdminRoute, superAdminRoutes);

const socketHandlers = setupSocket(server);
setSocketHandlers(socketHandlers);
questionLockCron.setIo(socketHandlers.io);
questionLockCron.start();

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
