const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  action: {
    type: String,
    required: true,
    enum: [
      'TASK_CREATED',
      'TASK_UPDATED',
      'TASK_DELETED',
      'TASK_ASSIGNED',
      'TASK_STATUS_CHANGED',
      'TASK_PRIORITY_UPDATED',
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_DELETED',
      'MEMBER_ADDED',
      'MEMBER_REMOVED',
      'AI_ANALYSIS_GENERATED',
    ],
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for recent activity queries
activitySchema.index({ createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
