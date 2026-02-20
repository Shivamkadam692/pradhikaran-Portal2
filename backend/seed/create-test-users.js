require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models');
const { ROLES } = require('./config/constants');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pradhikaran_portal';

async function createTestUsers() {
  await mongoose.connect(MONGODB_URI);
  
  try {
    // Create test Department user
    let deptUser = await User.findOne({ email: 'dept@test.com' });
    if (!deptUser) {
      deptUser = new User({
        name: 'Test Department',
        email: 'dept@test.com',
        password: 'password123',
        departmentName: 'Health',
        role: ROLES.DEPARTMENT,
        isApproved: true,
      });
      await deptUser.save();
      console.log('✓ Created test Department user: dept@test.com');
    } else {
      console.log('✓ Test Department user already exists: dept@test.com');
    }
    
    // Create test Pradhikaran user
    let pradhikaranUser = await User.findOne({ email: 'pradhikaran@test.com' });
    if (!pradhikaranUser) {
      pradhikaranUser = new User({
        name: 'Test Pradhikaran',
        email: 'pradhikaran@test.com',
        password: 'password123',
        role: ROLES.PRADHIKARAN,
        isApproved: true,
      });
      await pradhikaranUser.save();
      console.log('✓ Created test Pradhikaran user: pradhikaran@test.com');
    } else {
      console.log('✓ Test Pradhikaran user already exists: pradhikaran@test.com');
    }
    
    console.log('\nTest users created successfully!');
    console.log('Department login: dept@test.com / password123');
    console.log('Pradhikaran login: pradhikaran@test.com / password123');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestUsers();