const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true,
  },
  complexity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  },
  estimatedHours: {
    type: Number,
    default: 0,
  },
  requiredSkills: [{
    type: String,
  }],
  risks: [{
    type: String,
  }],
  suggestedSubtasks: [{
    title: String,
    estimatedHours: Number,
  }],
  suggestedDependencies: [{
    type: String,
  }],
  reasoning: {
    type: String,
    default: '',
  },
  provider: {
    type: String,
    enum: ['local-rule-engine', 'ollama', 'external-api'],
    default: 'local-rule-engine',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AiAnalysis', aiAnalysisSchema);
