const Task = require('../models/Task');
const AiAnalysis = require('../models/AiAnalysis');
const Activity = require('../models/Activity');
const aiService = require('../services/ai/ai.service');
const { calculateTaskPriority } = require('../services/priority/priority.service');

// POST /api/ai/analyze-task
exports.analyzeTask = async (req, res, next) => {
  try {
    const { taskId } = req.body;

    let taskData;
    if (taskId) {
      taskData = await Task.findById(taskId).populate('dependencies', 'title status');
      if (!taskData) {
        return res.status(404).json({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
      }
    } else {
      // Allow analysis of unsaved task data
      taskData = req.body;
    }

    const analysis = await aiService.analyzeTask(taskData);

    // Save analysis to database if task exists
    if (taskId) {
      await AiAnalysis.create({ taskId, ...analysis });
      
      // Update task with latest analysis
      await Task.findByIdAndUpdate(taskId, {
        aiAnalysis: { ...analysis, analyzedAt: new Date() },
      });

      await Activity.create({
        user: req.user._id,
        project: taskData.projectId,
        task: taskId,
        action: 'AI_ANALYSIS_GENERATED',
        metadata: { provider: analysis.provider },
      });
    }

    res.json({ success: true, data: analysis });
  } catch (error) {
    // AI failure fallback
    console.error('AI analysis error:', error.message);
    try {
      const localAI = require('../services/ai/local-ai.service');
      const fallbackAnalysis = localAI.analyzeTask(req.body);
      res.json({
        success: true,
        data: fallbackAnalysis,
        warning: 'Using fallback local analysis engine',
      });
    } catch (fallbackError) {
      next(fallbackError);
    }
  }
};

// POST /api/ai/breakdown-task
exports.breakdownTask = async (req, res, next) => {
  try {
    const { taskId } = req.body;

    let taskData;
    if (taskId) {
      taskData = await Task.findById(taskId);
      if (!taskData) {
        return res.status(404).json({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
      }
    } else {
      taskData = req.body;
    }

    const breakdown = await aiService.breakdownTask(taskData);
    res.json({ success: true, data: breakdown });
  } catch (error) {
    console.error('AI breakdown error:', error.message);
    try {
      const localAI = require('../services/ai/local-ai.service');
      const fallback = localAI.breakdownTask(req.body);
      res.json({ success: true, data: fallback, warning: 'Using fallback local analysis engine' });
    } catch (fallbackError) {
      next(fallbackError);
    }
  }
};

// POST /api/ai/explain-priority
exports.explainPriority = async (req, res, next) => {
  try {
    const { taskId } = req.body;

    const task = await Task.findById(taskId).populate('dependencies', 'title status priorityScore');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
    }

    const priorityResult = await calculateTaskPriority(task);
    const explanation = aiService.explainPriority(priorityResult);

    res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};

// GET /api/ai/status
exports.getAIStatus = async (req, res, next) => {
  try {
    const status = await aiService.getProviderStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};
