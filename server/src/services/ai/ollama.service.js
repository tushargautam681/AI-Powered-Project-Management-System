/**
 * Ollama Service (Optional)
 * 
 * Uses locally-installed Ollama for LLM-assisted analysis.
 * Only used if Ollama is installed and running.
 * Falls back to local engine if unavailable.
 */

const { AI_CONFIG } = require('../../config/ai.config');

let ollamaAvailable = null; // Cached availability check

/**
 * Check if Ollama is available.
 */
async function isOllamaAvailable() {
  if (ollamaAvailable !== null) return ollamaAvailable;

  try {
    const response = await fetch(`${AI_CONFIG.ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    ollamaAvailable = response.ok;
    if (ollamaAvailable) {
      console.log('✅ Ollama detected and available');
    }
    return ollamaAvailable;
  } catch {
    ollamaAvailable = false;
    return false;
  }
}

/**
 * Analyze a task using Ollama.
 */
async function analyzeTask(task) {
  const prompt = `You are a project management AI assistant. Analyze this task and provide a JSON response.

Task: ${task.title}
Description: ${task.description || 'No description'}
Business Impact: ${task.businessImpact || 'MEDIUM'}
Current Complexity: ${task.complexity || 'MEDIUM'}

Respond ONLY with valid JSON in this exact format:
{
  "complexity": "LOW|MEDIUM|HIGH",
  "estimatedHours": <number>,
  "requiredSkills": ["skill1", "skill2"],
  "risks": ["risk1", "risk2"],
  "suggestedSubtasks": [{"title": "subtask", "estimatedHours": <number>}],
  "suggestedDependencies": ["dep1"],
  "reasoning": "explanation"
}`;

  const response = await callOllama(prompt);
  const parsed = parseOllamaJSON(response);
  return { ...parsed, provider: 'ollama' };
}

/**
 * Break down a task using Ollama.
 */
async function breakdownTask(task) {
  const prompt = `Break down this project task into subtasks. 

Task: ${task.title}
Description: ${task.description || 'No description'}

Respond ONLY with valid JSON:
{
  "subtasks": [{"title": "subtask name", "estimatedHours": <number>, "complexity": "LOW|MEDIUM|HIGH"}],
  "totalEstimatedHours": <number>,
  "reasoning": "explanation"
}`;

  const response = await callOllama(prompt);
  const parsed = parseOllamaJSON(response);
  return { parentTask: task.title, ...parsed, provider: 'ollama' };
}

/**
 * Call Ollama API.
 */
async function callOllama(prompt) {
  const response = await fetch(`${AI_CONFIG.ollamaBaseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_CONFIG.ollamaModel,
      prompt,
      stream: false,
      options: { temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(AI_CONFIG.ollamaTimeout),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Parse JSON from Ollama response (may contain extra text).
 */
function parseOllamaJSON(text) {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch {
    // Extract JSON from text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse Ollama response as JSON');
  }
}

// Reset cache (useful for testing)
function resetCache() {
  ollamaAvailable = null;
}

module.exports = { isOllamaAvailable, analyzeTask, breakdownTask, resetCache };
