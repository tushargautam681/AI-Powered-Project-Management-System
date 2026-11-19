/**
 * Deadline Urgency Calculator
 * 
 * Calculates urgency score (0-100) based on days remaining until deadline.
 * Always returns a valid number, handles edge cases.
 */
const { DEADLINE_URGENCY_MAP } = require('../../config/priority.config');

/**
 * @param {Date|null} deadline - Task deadline
 * @returns {number} Urgency score 0-100
 */
function calculateDeadlineUrgency(deadline) {
  // No deadline = low urgency
  if (!deadline) return 20;

  const now = new Date();
  const deadlineDate = new Date(deadline);

  // Invalid date
  if (isNaN(deadlineDate.getTime())) return 20;

  const diffMs = deadlineDate.getTime() - now.getTime();
  const daysRemaining = diffMs / (1000 * 60 * 60 * 24);

  // Overdue
  if (daysRemaining < 0) return 100;

  // Find matching bracket
  for (const bracket of DEADLINE_URGENCY_MAP) {
    if (daysRemaining <= bracket.maxDays) {
      return bracket.score;
    }
  }

  // Fallback
  return 20;
}

module.exports = { calculateDeadlineUrgency };
