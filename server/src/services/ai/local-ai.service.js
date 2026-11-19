/**
 * Local AI Analysis Engine
 * 
 * Rule-based intelligent analysis — works WITHOUT any API key, internet, or LLM.
 * Uses keyword detection, pattern matching, and template-based generation.
 * 
 * This is academically described as:
 * "AI-assisted intelligent task analysis using rule-based classification"
 */

const { SKILL_KEYWORDS, TASK_TEMPLATES, RISK_KEYWORDS } = require('../../config/ai.config');

/**
 * Analyze a task using local rule-based intelligence.
 * 
 * @param {Object} task - Task data { title, description, complexity, businessImpact, deadline, estimatedHours, dependencies }
 * @returns {Object} Analysis result
 */
function analyzeTask(task) {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();

  const requiredSkills = detectSkills(text);
  const estimatedComplexity = estimateComplexity(task, text);
  const estimatedHours = estimateHours(task, estimatedComplexity, requiredSkills.length);
  const risks = detectRisks(text, task);
  const reasoning = generateReasoning(task, estimatedComplexity, requiredSkills, risks);

  return {
    complexity: estimatedComplexity,
    estimatedHours,
    requiredSkills,
    risks,
    suggestedSubtasks: [],
    suggestedDependencies: detectSuggestedDependencies(text),
    reasoning,
    provider: 'local-rule-engine',
  };
}

/**
 * Break a task into subtasks using template matching.
 */
function breakdownTask(task) {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();

  // Find best matching template
  let bestTemplate = TASK_TEMPLATES.generic;
  let bestMatchCount = 0;

  for (const [key, template] of Object.entries(TASK_TEMPLATES)) {
    if (key === 'generic') continue;
    const matchCount = template.keywords.filter(kw => text.includes(kw)).length;
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestTemplate = template;
    }
  }

  // Customize subtask titles with task context
  const parentTitle = task.title || 'Task';
  const subtasks = bestTemplate.subtasks.map(st => ({
    title: st.title,
    estimatedHours: st.estimatedHours,
    complexity: st.estimatedHours > 2 ? 'MEDIUM' : 'LOW',
  }));

  return {
    parentTask: parentTitle,
    subtasks,
    totalEstimatedHours: subtasks.reduce((sum, s) => sum + s.estimatedHours, 0),
    reasoning: `Task broken down based on "${bestMatchCount > 0 ? 'matched template' : 'generic template'}" pattern analysis.`,
    provider: 'local-rule-engine',
  };
}

/**
 * Generate priority explanation in natural language.
 */
function explainPriority(priorityData) {
  const { score, category, factors, explanation } = priorityData;
  
  let narrative = `This task has a priority score of ${score} (${category}).\n\n`;
  narrative += 'Factor breakdown:\n';
  narrative += `• Deadline Urgency: ${factors.urgency}/100 (weight: 30%)\n`;
  narrative += `• Business Impact: ${factors.businessImpact}/100 (weight: 25%)\n`;
  narrative += `• Dependency Impact: ${factors.dependencyImpact}/100 (weight: 20%)\n`;
  narrative += `• Workload Factor: ${factors.workload}/100 (weight: 15%)\n`;
  narrative += `• Complexity: ${factors.complexity}/100 (weight: 10%)\n\n`;
  
  if (explanation && explanation.length > 0) {
    narrative += 'Key observations:\n';
    explanation.forEach(e => { narrative += `• ${e}\n`; });
  }

  return {
    narrative,
    score,
    category,
    factors,
    explanation,
    provider: 'local-rule-engine',
  };
}

// ---- Helper functions ----

function detectSkills(text) {
  const skills = new Set();
  for (const [keyword, skillList] of Object.entries(SKILL_KEYWORDS)) {
    if (text.includes(keyword)) {
      skillList.forEach(s => skills.add(s));
    }
  }
  return [...skills].slice(0, 8); // Max 8 skills
}

function estimateComplexity(task, text) {
  // If user already set complexity, respect it
  if (task.complexity && task.complexity !== 'MEDIUM') return task.complexity;

  let score = 0;

  // Text length suggests complexity
  if (text.length > 200) score += 2;
  if (text.length > 500) score += 1;

  // Keyword indicators
  const complexKeywords = ['integration', 'security', 'payment', 'migration', 'architecture', 'complex', 'algorithm'];
  const simpleKeywords = ['fix', 'typo', 'update', 'label', 'text', 'style', 'css', 'color'];

  complexKeywords.forEach(kw => { if (text.includes(kw)) score += 2; });
  simpleKeywords.forEach(kw => { if (text.includes(kw)) score -= 1; });

  // Dependencies increase complexity
  if (task.dependencies && task.dependencies.length > 2) score += 2;

  if (score >= 4) return 'HIGH';
  if (score <= 0) return 'LOW';
  return 'MEDIUM';
}

function estimateHours(task, complexity, skillCount) {
  if (task.estimatedHours > 0) return task.estimatedHours;

  const baseHours = { LOW: 4, MEDIUM: 8, HIGH: 16 };
  let hours = baseHours[complexity] || 8;

  // Adjust by skill variety
  if (skillCount > 4) hours += 4;
  else if (skillCount > 2) hours += 2;

  return hours;
}

function detectRisks(text, task) {
  const risks = [];

  // Keyword-based risks
  RISK_KEYWORDS.high.forEach(kw => {
    if (text.includes(kw)) risks.push(`Involves ${kw} — requires careful implementation`);
  });

  // Deadline risk
  if (task.deadline) {
    const daysLeft = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) risks.push('Deadline has already passed');
    else if (daysLeft < 3) risks.push('Very tight deadline');
  }

  // Complexity risk
  if (task.complexity === 'HIGH') risks.push('High complexity may lead to delays');

  // Dependencies risk
  if (task.dependencies && task.dependencies.length > 2) {
    risks.push('Multiple dependencies may cause blocking');
  }

  return [...new Set(risks)].slice(0, 6);
}

function detectSuggestedDependencies(text) {
  const deps = [];
  if (text.includes('api') || text.includes('endpoint')) deps.push('Database Design');
  if (text.includes('frontend') || text.includes('ui')) deps.push('API Implementation');
  if (text.includes('test')) deps.push('Feature Implementation');
  if (text.includes('deploy')) deps.push('Testing');
  if (text.includes('report')) deps.push('Data Collection');
  return deps.slice(0, 4);
}

function generateReasoning(task, complexity, skills, risks) {
  const parts = [];
  parts.push(`Task "${task.title}" has been analyzed using local intelligent analysis.`);
  parts.push(`Estimated complexity: ${complexity}.`);
  if (skills.length > 0) parts.push(`Key skills required: ${skills.join(', ')}.`);
  if (risks.length > 0) parts.push(`${risks.length} potential risk(s) identified.`);
  if (task.businessImpact === 'CRITICAL') parts.push('This task has critical business impact and should be prioritized.');
  return parts.join(' ');
}

module.exports = { analyzeTask, breakdownTask, explainPriority };
