const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');
require('../models/User');
const authRoutes = require('../routes/authRoutes');
const errorHandler = require('../middleware/errorHandler');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth', () => {
  describe('POST /api/auth/register', () => {
    it('should register a department with pending approval when valid department selected', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Dept',
          email: 'dept@test.com',
          password: 'Password123!',
          departmentName: 'Computer Science',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('DEPARTMENT');
      expect(res.body.data.user.departmentName).toBe('Computer Science');
      expect(res.body.data.user.isApproved).toBe(false);
    });

    it('should reject registration when department is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Dept',
          email: 'dept2@test.com',
          password: 'Password123!',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/department/i);
    });

    it('should reject registration when department is empty string', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Dept',
          email: 'dept3@test.com',
          password: 'Password123!',
          departmentName: '   ',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration when department is not in allowed list', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Dept',
          email: 'dept4@test.com',
          password: 'Password123!',
          departmentName: 'Engineering',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/department|one of/i);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'invalid',
          password: 'Password123!',
          departmentName: 'Mathematics and Statistics',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });
  });
});
