/**
 * Main Priority Service
 * 
 * Deterministic task prioritization engine.
 * Combines all factor scores using configurable weights.
 * 
 * Priority Score = 0.30×Urgency + 0.25×BusinessImpact + 0.20×DependencyImpact + 0.15×Workload + 0.10×Complexity
 */

const { PRIORITY_WEIGHTS, PRIORITY_CATEGORIES, BUSINESS_IMPACT_MAP, COMPLEXITY_MAP } = require('../../config/priority.config');
const { calculateDeadlineUrgency } = require('./deadline.service');
const { calculateDependencyImpact } = require('./dependency.service');
const { calculateWorkloadFactor } = require('./workload.service');

/**
 * Calculate complete priority for a task.
 * 
 * @param {Object} task - Mongoose task document
 * @returns {Promise<{score: number, category: string, factors: Object, explanation: string[]}>}
 */
async function calculateTaskPriority(task) {
  // Calculate each factor
  const urgency = calculateDeadlineUrgency(task.deadline);
  const businessImpact = BUSINESS_IMPACT_MAP[task.businessImpact] || 50;
  const { score: dependencyScore, dependentCount } = await calculateDependencyImpact(task._id);
  const workloadResult = await calculateWorkloadFactor(task.assignedTo);
  const complexity = COMPLEXITY_MAP[task.complexity] || 60;

  // Weighted sum
  const rawScore =
    PRIORITY_WEIGHTS.urgency * urgency +
    PRIORITY_WEIGHTS.businessImpact * businessImpact +
    PRIORITY_WEIGHTS.dependencyImpact * dependencyScore +
    PRIORITY_WEIGHTS.workload * workloadResult.score +
    PRIORITY_WEIGHTS.complexity * complexity;

  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  // Determine category
  let category = 'LOW';
  for (const [key, range] of Object.entries(PRIORITY_CATEGORIES)) {
    if (score >= range.min && score <= range.max) {
      category = key;
      break;
    }
  }

  // Generate human-readable explanation
  const explanation = [];

  if (urgency >= 90) explanation.push('Deadline is approaching or has passed');
  else if (urgency >= 75) explanation.push('Deadline is within a week');
  else if (urgency <= 35) explanation.push('Deadline is not urgent');

  if (businessImpact >= 100) explanation.push('Business impact is critical');
  else if (businessImpact >= 75) explanation.push('Business impact is high');
  else if (businessImpact <= 25) explanation.push('Business impact is low');

  if (dependentCount >= 3) explanation.push(`Task blocks ${dependentCount} other tasks`);
  else if (dependentCount >= 1) explanation.push(`Task blocks ${dependentCount} other task(s)`);

  if (workloadResult.percentage >= 80) explanation.push('Assigned developer has high workload');
  else if (workloadResult.percentage >= 50) explanation.push('Assigned developer has moderate workload');
  
  if (!task.assignedTo) explanation.push('No developer assigned yet');

  if (complexity >= 90) explanation.push('Task complexity is high');
  else if (complexity <= 30) explanation.push('Task complexity is low');

  if (explanation.length === 0) explanation.push('Standard priority based on balanced factors');

  const factors = {
    urgency,
    businessImpact,
    dependencyImpact: dependencyScore,
    workload: workloadResult.score,
    complexity,
  };

  return { score, category, factors, explanation };
}

/**
 * Get priority category from score.
 */
function getPriorityCategory(score) {
  for (const [key, range] of Object.entries(PRIORITY_CATEGORIES)) {
    if (score >= range.min && score <= range.max) {
      return key;
    }
  }
  return 'LOW';
}

module.exports = { calculateTaskPriority, getPriorityCategory };
