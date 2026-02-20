const mongoose = require('mongoose');
const { ACTIVITY_ACTIONS, ACTIVITY_STATUS } = require('../config/constants');

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, enum: Object.values(ACTIVITY_ACTIONS) },
    entityType: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: Object.values(ACTIVITY_STATUS), default: ACTIVITY_STATUS.SUCCESS },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: true,
  }
);

activityLogSchema.index({ user: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ status: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
