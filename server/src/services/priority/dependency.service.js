/**
 * Dependency Impact Calculator
 * 
 * Calculates how many other tasks depend on this task,
 * and whether those dependent tasks are important/blocked.
 */
const Task = require('../../models/Task');
const { DEPENDENCY_IMPACT_MAP } = require('../../config/priority.config');

/**
 * Calculate dependency impact score for a task.
 * A task that blocks many other tasks should be prioritized higher.
 * 
 * @param {string} taskId - The task ID
 * @returns {Promise<{score: number, dependentCount: number}>}
 */
async function calculateDependencyImpact(taskId) {
  if (!taskId) return { score: 20, dependentCount: 0 };

  try {
    // Find tasks that depend on this task (i.e., this task is in their dependencies array)
    const dependentTasks = await Task.find({
      dependencies: taskId,
      status: { $ne: 'DONE' },
    }).select('priorityScore status');

    const dependentCount = dependentTasks.length;

    // Base score from count
    let score = 20;
    for (const bracket of DEPENDENCY_IMPACT_MAP) {
      if (dependentCount <= bracket.maxDeps) {
        score = bracket.score;
        break;
      }
    }

    // Bonus: if dependent tasks have high priority scores, this task is more important
    if (dependentCount > 0) {
      const avgDependentPriority = dependentTasks.reduce((sum, t) => sum + (t.priorityScore || 0), 0) / dependentCount;
      if (avgDependentPriority > 70) {
        score = Math.min(100, score + 10);
      }
    }

    return { score, dependentCount };
  } catch (error) {
    console.error('Dependency calculation error:', error.message);
    return { score: 20, dependentCount: 0 };
  }
}

module.exports = { calculateDependencyImpact };
