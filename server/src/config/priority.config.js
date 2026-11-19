/**
 * Priority Engine Configuration
 * 
 * All weights and thresholds for the deterministic priority scoring system.
 * Weights MUST sum to 1.0.
 * All factor scores are normalized to 0-100.
 */

const PRIORITY_WEIGHTS = {
  urgency: 0.30,
  businessImpact: 0.25,
  dependencyImpact: 0.20,
  workload: 0.15,
  complexity: 0.10,
};

const PRIORITY_CATEGORIES = {
  LOW: { min: 0, max: 30, label: 'LOW', color: '#22c55e' },
  MEDIUM: { min: 31, max: 60, label: 'MEDIUM', color: '#f59e0b' },
  HIGH: { min: 61, max: 80, label: 'HIGH', color: '#f97316' },
  CRITICAL: { min: 81, max: 100, label: 'CRITICAL', color: '#ef4444' },
};

const DEADLINE_URGENCY_MAP = [
  { maxDays: -Infinity, score: 100 }, // Overdue
  { maxDays: 0, score: 100 },          // Due today
  { maxDays: 1, score: 100 },          // Due tomorrow
  { maxDays: 3, score: 90 },           // 2-3 days
  { maxDays: 7, score: 75 },           // 4-7 days
  { maxDays: 14, score: 55 },          // 8-14 days
  { maxDays: 30, score: 35 },          // 15-30 days
  { maxDays: Infinity, score: 20 },    // More than 30 days
];

const BUSINESS_IMPACT_MAP = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 100,
};

const COMPLEXITY_MAP = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 90,
};

const DEPENDENCY_IMPACT_MAP = [
  { maxDeps: 0, score: 20 },
  { maxDeps: 1, score: 40 },
  { maxDeps: 2, score: 60 },
  { maxDeps: 3, score: 80 },
  { maxDeps: Infinity, score: 100 },
];

const WORKLOAD_THRESHOLDS = [
  { maxPercent: 30, score: 25 },
  { maxPercent: 60, score: 50 },
  { maxPercent: 80, score: 75 },
  { maxPercent: 100, score: 90 },
  { maxPercent: Infinity, score: 100 },
];

module.exports = {
  PRIORITY_WEIGHTS,
  PRIORITY_CATEGORIES,
  DEADLINE_URGENCY_MAP,
  BUSINESS_IMPACT_MAP,
  COMPLEXITY_MAP,
  DEPENDENCY_IMPACT_MAP,
  WORKLOAD_THRESHOLDS,
};
