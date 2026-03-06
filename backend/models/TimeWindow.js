const mongoose = require('mongoose');

const timeWindowSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['question', 'answer'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

timeWindowSchema.index({ type: 1, isActive: 1 });
timeWindowSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('TimeWindow', timeWindowSchema);
