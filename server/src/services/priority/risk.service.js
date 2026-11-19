/**
 * Risk Detection Service
 * 
 * Deterministic risk assessment based on task properties.
 * NO machine learning — pure rule-based logic.
 */

/**
 * Calculate risk level for a task.
 * 
 * @param {Object} task - Task document
 * @returns {{level: string, factors: string[], score: number}}
 */
function calculateRisk(task) {
  const factors = [];
  let riskScore = 0;

  // Factor 1: Deadline
  if (task.deadline) {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const daysRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysRemaining < 0) {
      riskScore += 40;
      factors.push('Deadline has passed');
    } else if (daysRemaining <= 2) {
      riskScore += 30;
      factors.push('Deadline is within 2 days');
    } else if (daysRemaining <= 7) {
      riskScore += 15;
      factors.push('Deadline is within a week');
    }
  }

  // Factor 2: Complexity
  if (task.complexity === 'HIGH') {
    riskScore += 20;
    factors.push('High complexity task');
  } else if (task.complexity === 'MEDIUM') {
    riskScore += 10;
  }

  // Factor 3: Estimated effort
  if (task.estimatedHours > 20) {
    riskScore += 15;
    factors.push('High estimated effort (>20 hours)');
  } else if (task.estimatedHours > 10) {
    riskScore += 8;
    factors.push('Moderate estimated effort');
  }

  // Factor 4: Dependencies
  const depCount = task.dependencies ? task.dependencies.length : 0;
  if (depCount >= 3) {
    riskScore += 15;
    factors.push(`Task depends on ${depCount} other tasks`);
  } else if (depCount >= 1) {
    riskScore += 5;
    factors.push(`Task has ${depCount} dependency`);
  }

  // Factor 5: Business impact + approaching deadline
  if (task.businessImpact === 'CRITICAL' && task.deadline) {
    const daysRemaining = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysRemaining <= 7) {
      riskScore += 10;
      factors.push('Critical business impact with approaching deadline');
    }
  }

  // Factor 6: No assignee
  if (!task.assignedTo) {
    riskScore += 10;
    factors.push('No developer assigned');
  }

  // Determine level
  let level;
  if (riskScore >= 60) level = 'CRITICAL';
  else if (riskScore >= 40) level = 'HIGH';
  else if (riskScore >= 20) level = 'MEDIUM';
  else level = 'LOW';

  return { level, factors, score: Math.min(100, riskScore) };
}

module.exports = { calculateRisk };
