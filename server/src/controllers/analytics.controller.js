const Task = require('../models/Task');
const Project = require('../models/Project');
const { getTeamWorkload } = require('../services/priority/workload.service');

// GET /api/analytics/project/:id
exports.getProjectAnalytics = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found', code: 'NOT_FOUND' });
    }

    const tasks = await Task.find({ projectId });

    // Tasks by status
    const tasksByStatus = {};
    ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].forEach(s => { tasksByStatus[s] = 0; });
    tasks.forEach(t => { tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1; });

    // Tasks by priority
    const tasksByPriority = {};
    ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].forEach(p => { tasksByPriority[p] = 0; });
    tasks.forEach(t => { tasksByPriority[t.priority] = (tasksByPriority[t.priority] || 0) + 1; });

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'DONE');

    // Completed vs pending
    const completed = tasks.filter(t => t.status === 'DONE').length;
    const pending = tasks.length - completed;

    // Project progress
    const totalProgress = tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
      : 0;

    // Critical tasks
    const criticalTasks = tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'DONE');

    // Risk distribution
    const riskDistribution = {};
    ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].forEach(r => { riskDistribution[r] = 0; });
    tasks.forEach(t => { riskDistribution[t.riskLevel] = (riskDistribution[t.riskLevel] || 0) + 1; });

    res.json({
      success: true,
      data: {
        totalTasks: tasks.length,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdueTasks.length,
        criticalTasks: criticalTasks.length,
        projectProgress: totalProgress,
        tasksByStatus,
        tasksByPriority,
        riskDistribution,
        overdueTasksList: overdueTasks.map(t => ({
          _id: t._id, title: t.title, deadline: t.deadline, priority: t.priority,
        })),
        criticalTasksList: criticalTasks.map(t => ({
          _id: t._id, title: t.title, priorityScore: t.priorityScore, deadline: t.deadline,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/workload
exports.getWorkloadAnalytics = async (req, res, next) => {
  try {
    const workload = await getTeamWorkload();
    res.json({ success: true, data: workload });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/priorities
exports.getPriorityAnalytics = async (req, res, next) => {
  try {
    const tasks = await Task.find({ status: { $ne: 'DONE' } })
      .populate('assignedTo', 'name email avatar')
      .populate('projectId', 'name')
      .sort({ priorityScore: -1 })
      .limit(20);

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProjects,
      activeProjects,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'ACTIVE' }),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([
        { $match: { status: { $ne: 'DONE' } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({ deadline: { $lt: new Date() }, status: { $ne: 'DONE' } }),
    ]);

    // Build status map
    const statusMap = { BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasksByStatus.forEach(s => { statusMap[s._id] = s.count; });

    // Build priority map
    const priorityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    tasksByPriority.forEach(p => { priorityMap[p._id] = p.count; });

    // Recommended next tasks (highest priority, not done)
    const recommendedTasks = await Task.find({ status: { $ne: 'DONE' } })
      .populate('assignedTo', 'name email avatar')
      .populate('projectId', 'name')
      .sort({ priorityScore: -1, deadline: 1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        totalTasks,
        activeTasks: statusMap.TODO + statusMap.IN_PROGRESS + statusMap.IN_REVIEW,
        completedTasks: statusMap.DONE,
        overdueTasks,
        criticalTasks: priorityMap.CRITICAL,
        tasksByStatus: statusMap,
        tasksByPriority: priorityMap,
        recommendedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};
