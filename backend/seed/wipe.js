require('dotenv').config();
const mongoose = require('mongoose');
const { User, Question, Answer, ActivityLog } = require('../models');
const { ROLES } = require('../config/constants');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pradhikaran_portal';
const SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@pradhikaran.local';
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

async function wipe() {
  await mongoose.connect(MONGODB_URI);

  const [questionsDeleted, answersDeleted, logsDeleted] = await Promise.all([
    Question.deleteMany({}),
    Answer.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  const usersDeleted = await User.deleteMany({
    email: { $ne: SUPER_ADMIN_EMAIL },
  });

  let superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  if (!superAdmin) {
    superAdmin = new User({
      name: 'Super Admin',
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      role: ROLES.SUPER_ADMIN,
      isApproved: true,
    });
    await superAdmin.save();
    console.log('Super Admin created:', SUPER_ADMIN_EMAIL);
  } else {
    superAdmin.password = SUPER_ADMIN_PASSWORD;
    await superAdmin.save();
    console.log('Super Admin password reset:', SUPER_ADMIN_EMAIL);
  }

  console.log('Wipe complete:');
  console.log('  Questions removed:', questionsDeleted.deletedCount);
  console.log('  Answers removed:', answersDeleted.deletedCount);
  console.log('  Activity logs removed:', logsDeleted.deletedCount);
  console.log('  Users removed (Pradhikaran/Department):', usersDeleted.deletedCount);
  console.log('Login with:', SUPER_ADMIN_EMAIL, '/', SUPER_ADMIN_PASSWORD);

  await mongoose.disconnect();
  process.exit(0);
}

wipe().catch((err) => {
  console.error(err);
  process.exit(1);
});
