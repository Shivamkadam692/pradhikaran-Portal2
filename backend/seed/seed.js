require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');
const { ROLES } = require('../config/constants');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pradhikaran_portal';
const SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@pradhikaran.local';
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  let existing = await User.findOne({ email: SUPER_ADMIN_EMAIL, isDeleted: { $ne: true } });
  if (existing) {
    existing.password = SUPER_ADMIN_PASSWORD;
    await existing.save();
    console.log('Super Admin password updated:', SUPER_ADMIN_EMAIL);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }
  const superAdmin = new User({
    name: 'Super Admin',
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    role: ROLES.SUPER_ADMIN,
    isApproved: true,
  });
  await superAdmin.save();
  console.log('Super Admin created:', SUPER_ADMIN_EMAIL);
  console.log('Login at /login and use secret path for Super Admin dashboard.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
