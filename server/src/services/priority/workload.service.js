/**
 * Workload Factor Calculator
 * 
 * Calculates workload percentage for the assigned developer.
 * Higher workload = developer is busy = task should get higher priority
 * (to surface overload situations).
 */
const Task = require('../../models/Task');
const { WORKLOAD_THRESHOLDS } = require('../../config/priority.config');

/**
 * Calculate workload score for a developer.
 * 
 * @param {string|null} assignedTo - Developer user ID
 * @returns {Promise<{score: number, percentage: number, activeTasks: number, totalHours: number}>}
 */
async function calculateWorkloadFactor(assignedTo) {
  if (!assignedTo) return { score: 25, percentage: 0, activeTasks: 0, totalHours: 0 };

  try {
    const activeTasks = await Task.find({
      assignedTo,
      status: { $in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
    }).select('estimatedHours status deadline');

    const totalActiveTasks = activeTasks.length;
    const totalEstimatedHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const overdueTasks = activeTasks.filter(t => t.deadline && new Date() > new Date(t.deadline)).length;

    // Assume 40 hours per week capacity
    const weeklyCapacity = 40;
    const workloadPercent = Math.round((totalEstimatedHours / weeklyCapacity) * 100);

    // Find score from thresholds
    let score = 25;
    for (const threshold of WORKLOAD_THRESHOLDS) {
      if (workloadPercent <= threshold.maxPercent) {
        score = threshold.score;
        break;
      }
    }

    // Bonus for overdue tasks
    if (overdueTasks > 0) {
      score = Math.min(100, score + overdueTasks * 5);
    }

    return {
      score,
      percentage: workloadPercent,
      activeTasks: totalActiveTasks,
      totalHours: totalEstimatedHours,
      overdueTasks,
    };
  } catch (error) {
    console.error('Workload calculation error:', error.message);
    return { score: 25, percentage: 0, activeTasks: 0, totalHours: 0 };
  }
}

/**
 * Get workload summary for all developers.
 */
async function getTeamWorkload() {
  try {
    const workload = await Task.aggregate([
      { $match: { assignedTo: { $ne: null }, status: { $ne: 'DONE' } } },
      {
        $group: {
          _id: '$assignedTo',
          activeTasks: { $sum: 1 },
          totalEstimatedHours: { $sum: '$estimatedHours' },
          overdueTasks: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$deadline', null] }, { $lt: ['$deadline', new Date()] }, { $ne: ['$status', 'DONE'] }] },
                1,
                0,
              ],
            },
          },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          avatar: '$user.avatar',
          activeTasks: 1,
          totalEstimatedHours: 1,
          overdueTasks: 1,
          completedTasks: 1,
          workloadPercentage: {
            $round: [{ $multiply: [{ $divide: ['$totalEstimatedHours', 40] }, 100] }, 0],
          },
        },
      },
    ]);

    return workload;
  } catch (error) {
    console.error('Team workload error:', error.message);
    return [];
  }
}

module.exports = { calculateWorkloadFactor, getTeamWorkload };
