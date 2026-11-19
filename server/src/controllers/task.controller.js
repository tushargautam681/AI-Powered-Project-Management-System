const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { calculateTaskPriority } = require('../services/priority/priority.service');
const { calculateRisk } = require('../services/priority/risk.service');

// GET /api/tasks?projectId=xxx&status=xxx&assignedTo=xxx
exports.getTasks = async (req, res, next) => {
  try {
    const { projectId, status, assignedTo } = req.query;
    const query = {};
    
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('dependencies', 'title status priorityScore')
      .sort({ priorityScore: -1, deadline: 1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar role skills')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name')
      .populate('dependencies', 'title status priorityScore deadline');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const {
      title, description, projectId, assignedTo, status,
      businessImpact, complexity, deadline, estimatedHours,
      dependencies, tags,
    } = req.body;

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'BACKLOG',
      businessImpact: businessImpact || 'MEDIUM',
      complexity: complexity || 'MEDIUM',
      deadline: deadline || null,
      estimatedHours: estimatedHours || 0,
      dependencies: dependencies || [],
      tags: tags || [],
    });

    // Auto-calculate priority
    try {
      const priorityResult = await calculateTaskPriority(task);
      task.priorityScore = priorityResult.score;
      task.priority = priorityResult.category;
      task.priorityExplanation = priorityResult.explanation;
      
      const riskResult = calculateRisk(task);
      task.riskLevel = riskResult.level;
      
      await task.save();
    } catch (priorityError) {
      console.error('Priority calculation error (non-fatal):', priorityError.message);
    }

    await Activity.create({
      user: req.user._id,
      project: projectId,
      task: task._id,
      action: 'TASK_CREATED',
      metadata: { taskTitle: task.title },
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('dependencies', 'title status');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
    }

    const updatableFields = [
      'title', 'description', 'assignedTo', 'status', 'businessImpact',
      'complexity', 'deadline', 'estimatedHours', 'actualHours',
      'dependencies', 'progress', 'tags',
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // Recalculate priority on relevant changes
    const priorityFields = ['businessImpact', 'complexity', 'deadline', 'dependencies', 'assignedTo'];
    const hasPriorityChange = priorityFields.some(f => req.body[f] !== undefined);
    
    if (hasPriorityChange) {
      try {
        const priorityResult = await calculateTaskPriority(task);
        task.priorityScore = priorityResult.score;
        task.priority = priorityResult.category;
        task.priorityExplanation = priorityResult.explanation;
        
        const riskResult = calculateRisk(task);
        task.riskLevel = riskResult.level;
      } catch (priorityError) {
        console.error('Priority recalculation error (non-fatal):', priorityError.message);
      }
    }

    await task.save();

    await Activity.create({
      user: req.user._id,
      project: task.projectId,
      task: task._id,
      action: 'TASK_UPDATED',
      metadata: { taskTitle: task.title, updatedFields: Object.keys(req.body) },
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('dependencies', 'title status');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
    }

    await Activity.create({
      user: req.user._id,
      project: task.projectId,
      task: task._id,
      action: 'TASK_DELETED',
      metadata: { taskTitle: task.title },
    });

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/status
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status', code: 'INVALID_STATUS' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
    }

    const oldStatus = task.status;
    task.status = status;
    
    // Auto-set progress
    if (status === 'DONE') task.progress = 100;
    else if (status === 'IN_REVIEW') task.progress = Math.max(task.progress, 80);
    else if (status === 'IN_PROGRESS') task.progress = Math.max(task.progress, 10);

    await task.save();

    await Activity.create({
      user: req.user._id,
      project: task.projectId,
      task: task._id,
      action: 'TASK_STATUS_CHANGED',
      metadata: { taskTitle: task.title, from: oldStatus, to: status },
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('dependencies', 'title status');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks/:id/prioritize
exports.prioritizeTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('dependencies', 'title status priorityScore');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
    }

    const priorityResult = await calculateTaskPriority(task);
    const riskResult = calculateRisk(task);

    task.priorityScore = priorityResult.score;
    task.priority = priorityResult.category;
    task.priorityExplanation = priorityResult.explanation;
    task.riskLevel = riskResult.level;
    await task.save();

    await Activity.create({
      user: req.user._id,
      project: task.projectId,
      task: task._id,
      action: 'TASK_PRIORITY_UPDATED',
      metadata: { score: priorityResult.score, category: priorityResult.category },
    });

    res.json({
      success: true,
      data: {
        task: task.toObject(),
        priority: priorityResult,
        risk: riskResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/reprioritize
exports.reprioritizeProject = async (req, res, next) => {
  try {
    const tasks = await Task.find({ projectId: req.params.id, status: { $ne: 'DONE' } })
      .populate('dependencies', 'title status priorityScore');

    const results = [];
    for (const task of tasks) {
      try {
        const priorityResult = await calculateTaskPriority(task);
        const riskResult = calculateRisk(task);

        task.priorityScore = priorityResult.score;
        task.priority = priorityResult.category;
        task.priorityExplanation = priorityResult.explanation;
        task.riskLevel = riskResult.level;
        await task.save();

        results.push({ taskId: task._id, title: task.title, ...priorityResult, risk: riskResult.level });
      } catch (err) {
        results.push({ taskId: task._id, title: task.title, error: err.message });
      }
    }

    res.json({ success: true, data: { tasksUpdated: results.length, results } });
  } catch (error) {
    next(error);
  }
};
