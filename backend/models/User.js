const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ROLES, REGISTRATION_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: function () { return this.role === ROLES.DEPARTMENT; } },
    role: {
      type: String,
      required: true,
      enum: Object.values(ROLES),
    },
    departmentName: { type: String, trim: true },
    subDepartmentName: { type: String, trim: true },
    isApproved: { type: Boolean, default: false },
    registrationRequest: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.PENDING,
    },
    registrationRejectionReason: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// email index is created by unique: true on the field
userSchema.index({ role: 1 });
userSchema.index({ isApproved: 1 });
userSchema.index({ isDeleted: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function (candidate) {
  if (!candidate || !this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
