const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 300,
  },
  description: {
    type: String,
    default: '',
    maxlength: 5000,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
    default: 'BACKLOG',
    index: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  },
  priorityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  businessImpact: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  },
  complexity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  },
  deadline: {
    type: Date,
    default: null,
  },
  estimatedHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  actualHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  aiAnalysis: {
    complexity: String,
    estimatedHours: Number,
    requiredSkills: [String],
    risks: [String],
    suggestedSubtasks: [{
      title: String,
      estimatedHours: Number,
    }],
    suggestedDependencies: [String],
    reasoning: String,
    provider: {
      type: String,
      enum: ['local-rule-engine', 'ollama', 'external-api'],
      default: 'local-rule-engine',
    },
    analyzedAt: Date,
  },
  priorityExplanation: [{
    type: String,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for efficient Kanban queries
taskSchema.index({ projectId: 1, status: 1, priorityScore: -1 });

// Virtual: days until deadline
taskSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const diff = this.deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual: is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return new Date() > this.deadline && this.status !== 'DONE';
});

// Virtual: dependent tasks count
taskSchema.virtual('dependencyCount').get(function() {
  return this.dependencies ? this.dependencies.length : 0;
});

module.exports = mongoose.model('Task', taskSchema);
