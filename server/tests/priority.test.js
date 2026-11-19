/**
 * Priority Engine Unit Tests
 * 
 * Tests the deterministic priority scoring system.
 * Run: npm test (from server/ or root)
 */

// Mock mongoose before requiring any model
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn(),
    model: jest.fn().mockReturnValue({
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    }),
  };
});

const { calculateDeadlineUrgency } = require('../src/services/priority/deadline.service');
const { calculateRisk } = require('../src/services/priority/risk.service');
const { PRIORITY_WEIGHTS, BUSINESS_IMPACT_MAP, COMPLEXITY_MAP } = require('../src/config/priority.config');

describe('Deadline Urgency Calculator', () => {
  test('returns 100 for past deadlines', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(calculateDeadlineUrgency(yesterday)).toBe(100);
  });

  test('returns 100 for deadlines within 1 day', () => {
    const tomorrow = new Date(Date.now() + 12 * 60 * 60 * 1000);
    expect(calculateDeadlineUrgency(tomorrow)).toBe(100);
  });

  test('returns 90 for deadlines 2-3 days away', () => {
    const threeDays = new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000);
    expect(calculateDeadlineUrgency(threeDays)).toBe(90);
  });

  test('returns 75 for deadlines 4-7 days away', () => {
    const fiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    expect(calculateDeadlineUrgency(fiveDays)).toBe(75);
  });

  test('returns 55 for deadlines 8-14 days away', () => {
    const tenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    expect(calculateDeadlineUrgency(tenDays)).toBe(55);
  });

  test('returns 35 for deadlines 15-30 days away', () => {
    const twentyDays = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    expect(calculateDeadlineUrgency(twentyDays)).toBe(35);
  });

  test('returns 20 for deadlines more than 30 days away', () => {
    const sixtyDays = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    expect(calculateDeadlineUrgency(sixtyDays)).toBe(20);
  });

  test('returns 20 for null deadline', () => {
    expect(calculateDeadlineUrgency(null)).toBe(20);
  });

  test('returns 20 for invalid date', () => {
    expect(calculateDeadlineUrgency('invalid')).toBe(20);
  });

  test('never returns NaN', () => {
    const results = [
      calculateDeadlineUrgency(null),
      calculateDeadlineUrgency(undefined),
      calculateDeadlineUrgency(''),
      calculateDeadlineUrgency(0),
      calculateDeadlineUrgency(new Date()),
      calculateDeadlineUrgency(new Date('2020-01-01')),
      calculateDeadlineUrgency(new Date('2030-01-01')),
    ];
    results.forEach(r => {
      expect(r).not.toBeNaN();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    });
  });
});

describe('Priority Weights Configuration', () => {
  test('weights sum to 1.0', () => {
    const sum = Object.values(PRIORITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
  });

  test('all weights are between 0 and 1', () => {
    Object.values(PRIORITY_WEIGHTS).forEach(w => {
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThanOrEqual(1);
    });
  });

  test('urgency has the highest weight', () => {
    expect(PRIORITY_WEIGHTS.urgency).toBeGreaterThan(PRIORITY_WEIGHTS.businessImpact);
    expect(PRIORITY_WEIGHTS.urgency).toBeGreaterThan(PRIORITY_WEIGHTS.dependencyImpact);
  });
});

describe('Business Impact Mapping', () => {
  test('maps LOW to 25', () => expect(BUSINESS_IMPACT_MAP.LOW).toBe(25));
  test('maps MEDIUM to 50', () => expect(BUSINESS_IMPACT_MAP.MEDIUM).toBe(50));
  test('maps HIGH to 75', () => expect(BUSINESS_IMPACT_MAP.HIGH).toBe(75));
  test('maps CRITICAL to 100', () => expect(BUSINESS_IMPACT_MAP.CRITICAL).toBe(100));
});

describe('Complexity Mapping', () => {
  test('maps LOW to 30', () => expect(COMPLEXITY_MAP.LOW).toBe(30));
  test('maps MEDIUM to 60', () => expect(COMPLEXITY_MAP.MEDIUM).toBe(60));
  test('maps HIGH to 90', () => expect(COMPLEXITY_MAP.HIGH).toBe(90));
});

describe('Priority Score Calculation (Manual)', () => {
  test('deterministic score: urgency=90, impact=100, dep=80, workload=60, complexity=90', () => {
    const score =
      PRIORITY_WEIGHTS.urgency * 90 +
      PRIORITY_WEIGHTS.businessImpact * 100 +
      PRIORITY_WEIGHTS.dependencyImpact * 80 +
      PRIORITY_WEIGHTS.workload * 60 +
      PRIORITY_WEIGHTS.complexity * 90;

    // 0.30*90 + 0.25*100 + 0.20*80 + 0.15*60 + 0.10*90
    // = 27 + 25 + 16 + 9 + 9 = 86
    expect(Math.round(score)).toBe(86);
  });

  test('low priority: urgency=20, impact=25, dep=20, workload=25, complexity=30', () => {
    const score =
      PRIORITY_WEIGHTS.urgency * 20 +
      PRIORITY_WEIGHTS.businessImpact * 25 +
      PRIORITY_WEIGHTS.dependencyImpact * 20 +
      PRIORITY_WEIGHTS.workload * 25 +
      PRIORITY_WEIGHTS.complexity * 30;

    // 0.30*20 + 0.25*25 + 0.20*20 + 0.15*25 + 0.10*30
    // = 6 + 6.25 + 4 + 3.75 + 3 = 23
    expect(Math.round(score)).toBe(23);
  });

  test('category assignment: 0-30=LOW, 31-60=MEDIUM, 61-80=HIGH, 81-100=CRITICAL', () => {
    const getCategory = (score) => {
      if (score <= 30) return 'LOW';
      if (score <= 60) return 'MEDIUM';
      if (score <= 80) return 'HIGH';
      return 'CRITICAL';
    };

    expect(getCategory(15)).toBe('LOW');
    expect(getCategory(30)).toBe('LOW');
    expect(getCategory(31)).toBe('MEDIUM');
    expect(getCategory(60)).toBe('MEDIUM');
    expect(getCategory(61)).toBe('HIGH');
    expect(getCategory(80)).toBe('HIGH');
    expect(getCategory(81)).toBe('CRITICAL');
    expect(getCategory(100)).toBe('CRITICAL');
  });
});

describe('Risk Detection', () => {
  test('CRITICAL risk for past deadlines with high complexity', () => {
    const task = {
      deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      complexity: 'HIGH',
      estimatedHours: 25,
      businessImpact: 'CRITICAL',
      dependencies: ['dep1', 'dep2', 'dep3'],
      assignedTo: null,
    };
    const result = calculateRisk(task);
    expect(result.level).toBe('CRITICAL');
    expect(result.factors.length).toBeGreaterThan(0);
  });

  test('LOW risk for simple task with far deadline', () => {
    const task = {
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      complexity: 'LOW',
      estimatedHours: 2,
      businessImpact: 'LOW',
      dependencies: [],
      assignedTo: 'someUserId',
    };
    const result = calculateRisk(task);
    expect(result.level).toBe('LOW');
  });

  test('includes relevant risk factors', () => {
    const task = {
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      complexity: 'HIGH',
      estimatedHours: 5,
      dependencies: [],
      assignedTo: null,
    };
    const result = calculateRisk(task);
    expect(result.factors).toContain('Deadline has passed');
    expect(result.factors).toContain('High complexity task');
    expect(result.factors).toContain('No developer assigned');
  });

  test('risk score is between 0 and 100', () => {
    const tasks = [
      { deadline: null, complexity: 'LOW', estimatedHours: 1, dependencies: [], assignedTo: 'user1' },
      { deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), complexity: 'HIGH', estimatedHours: 30, businessImpact: 'CRITICAL', dependencies: ['a','b','c','d'], assignedTo: null },
    ];
    tasks.forEach(task => {
      const result = calculateRisk(task);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});

describe('Local AI Engine', () => {
  const localAI = require('../src/services/ai/local-ai.service');

  test('analyzeTask returns valid structure', () => {
    const task = {
      title: 'Build authentication system with JWT',
      description: 'Implement login, register, JWT tokens, password hashing',
      complexity: 'HIGH',
      businessImpact: 'CRITICAL',
    };
    const result = localAI.analyzeTask(task);

    expect(result).toHaveProperty('complexity');
    expect(result).toHaveProperty('estimatedHours');
    expect(result).toHaveProperty('requiredSkills');
    expect(result).toHaveProperty('risks');
    expect(result).toHaveProperty('reasoning');
    expect(result.provider).toBe('local-rule-engine');
    expect(result.requiredSkills.length).toBeGreaterThan(0);
  });

  test('detects authentication-related skills', () => {
    const task = { title: 'Authentication module', description: 'JWT login register' };
    const result = localAI.analyzeTask(task);
    expect(result.requiredSkills).toEqual(expect.arrayContaining(['Authentication']));
  });

  test('detects payment-related skills', () => {
    const task = { title: 'Payment gateway', description: 'Handle transactions' };
    const result = localAI.analyzeTask(task);
    expect(result.requiredSkills).toEqual(expect.arrayContaining(['Security']));
  });

  test('breakdownTask returns subtasks', () => {
    const task = { title: 'User Authentication', description: 'Login and register system' };
    const result = localAI.breakdownTask(task);

    expect(result).toHaveProperty('subtasks');
    expect(result.subtasks.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('totalEstimatedHours');
    expect(result.provider).toBe('local-rule-engine');
  });

  test('explainPriority returns narrative', () => {
    const priorityData = {
      score: 85,
      category: 'CRITICAL',
      factors: { urgency: 100, businessImpact: 100, dependencyImpact: 60, workload: 50, complexity: 90 },
      explanation: ['Deadline approaching', 'Critical business impact'],
    };
    const result = localAI.explainPriority(priorityData);

    expect(result).toHaveProperty('narrative');
    expect(result.narrative).toContain('85');
    expect(result.narrative).toContain('CRITICAL');
    expect(result.provider).toBe('local-rule-engine');
  });
});
