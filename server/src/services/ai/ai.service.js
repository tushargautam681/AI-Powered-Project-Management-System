/**
 * AI Service Orchestrator
 * 
 * 3-tier fallback architecture:
 *   Level A: Local rule-based engine (DEFAULT — always works)
 *   Level B: Ollama (optional — if installed locally)
 *   Level C: External API (future — if API key configured)
 * 
 * The application NEVER depends on an external AI provider.
 */

const { AI_CONFIG } = require('../../config/ai.config');
const localAI = require('./local-ai.service');
const ollamaService = require('./ollama.service');

/**
 * Analyze a task using the best available AI provider.
 */
async function analyzeTask(task) {
  const provider = AI_CONFIG.provider;

  // Try Ollama if configured
  if (provider === 'ollama') {
    try {
      const available = await ollamaService.isOllamaAvailable();
      if (available) {
        console.log('🤖 Using Ollama for task analysis');
        return await ollamaService.analyzeTask(task);
      }
    } catch (error) {
      console.warn('⚠️ Ollama failed, falling back to local engine:', error.message);
    }
  }

  // Default: Local AI engine
  console.log('🧠 Using local AI engine for task analysis');
  return localAI.analyzeTask(task);
}

/**
 * Break down a task into subtasks.
 */
async function breakdownTask(task) {
  const provider = AI_CONFIG.provider;

  if (provider === 'ollama') {
    try {
      const available = await ollamaService.isOllamaAvailable();
      if (available) {
        return await ollamaService.breakdownTask(task);
      }
    } catch (error) {
      console.warn('⚠️ Ollama breakdown failed, using local engine:', error.message);
    }
  }

  return localAI.breakdownTask(task);
}

/**
 * Explain a priority calculation in natural language.
 */
function explainPriority(priorityData) {
  return localAI.explainPriority(priorityData);
}

/**
 * Get current AI provider status.
 */
async function getProviderStatus() {
  const status = {
    configured: AI_CONFIG.provider,
    active: 'local-rule-engine',
    ollamaAvailable: false,
    externalConfigured: !!AI_CONFIG.apiKey,
  };

  if (AI_CONFIG.provider === 'ollama') {
    try {
      status.ollamaAvailable = await ollamaService.isOllamaAvailable();
      if (status.ollamaAvailable) status.active = 'ollama';
    } catch {
      // Ollama not available
    }
  }

  return status;
}

module.exports = { analyzeTask, breakdownTask, explainPriority, getProviderStatus };
