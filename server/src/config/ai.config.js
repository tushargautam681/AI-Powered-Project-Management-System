/**
 * AI Service Configuration
 * 
 * Controls which AI provider is used and fallback behavior.
 */

const AI_CONFIG = {
  // Current provider: 'local' | 'ollama' | 'openai' | 'gemini'
  provider: process.env.AI_PROVIDER || 'local',
  
  // External API settings (optional, for future use)
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || '',
  
  // Ollama settings (optional)
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.AI_MODEL || 'llama3.2',
  ollamaTimeout: 30000, // 30 seconds
  
  // Always fallback to local if external fails
  fallbackToLocal: true,
};

/**
 * Keyword-to-skill mappings for local AI analysis.
 * Used by local-ai.service.js for intelligent task analysis.
 */
const SKILL_KEYWORDS = {
  // Backend
  'api': ['Node.js', 'REST API', 'Backend'],
  'endpoint': ['Node.js', 'REST API', 'Backend'],
  'server': ['Node.js', 'Express', 'Backend'],
  'database': ['MongoDB', 'Database Design', 'Backend'],
  'schema': ['MongoDB', 'Database Design'],
  'mongodb': ['MongoDB', 'Database Design'],
  'sql': ['SQL', 'Database Design'],
  
  // Authentication & Security
  'authentication': ['Authentication', 'JWT', 'Security'],
  'auth': ['Authentication', 'JWT', 'Security'],
  'login': ['Authentication', 'JWT', 'Frontend'],
  'register': ['Authentication', 'JWT', 'Frontend'],
  'jwt': ['JWT', 'Authentication', 'Security'],
  'password': ['Security', 'Encryption'],
  'authorization': ['Authorization', 'RBAC', 'Security'],
  'security': ['Security', 'Authentication'],
  
  // Frontend
  'dashboard': ['React', 'Charts', 'Frontend', 'UI/UX'],
  'ui': ['React', 'CSS', 'Frontend', 'UI/UX'],
  'frontend': ['React', 'CSS', 'Frontend'],
  'component': ['React', 'Frontend'],
  'form': ['React', 'Form Validation', 'Frontend'],
  'chart': ['React', 'Recharts', 'Data Visualization'],
  'analytics': ['React', 'Charts', 'Data Visualization'],
  'responsive': ['CSS', 'Responsive Design', 'Frontend'],
  
  // Payment & Finance
  'payment': ['Node.js', 'API Integration', 'Security'],
  'gateway': ['API Integration', 'Backend', 'Security'],
  'transaction': ['Database', 'Backend', 'Security'],
  'billing': ['Backend', 'Database', 'API Integration'],
  'invoice': ['Backend', 'PDF Generation', 'Database'],
  
  // Communication
  'notification': ['Backend', 'WebSocket', 'Frontend'],
  'email': ['Node.js', 'Email Service', 'Backend'],
  'sms': ['API Integration', 'Backend'],
  'chat': ['WebSocket', 'Real-time', 'Frontend'],
  
  // Reporting
  'report': ['Data Visualization', 'Backend', 'PDF Generation'],
  'export': ['Backend', 'File Handling'],
  'pdf': ['PDF Generation', 'Backend'],
  
  // Testing
  'test': ['Testing', 'Jest', 'QA'],
  'testing': ['Testing', 'Jest', 'QA'],
  'debug': ['Debugging', 'Testing'],
  
  // General
  'design': ['UI/UX', 'Frontend', 'CSS'],
  'deploy': ['DevOps', 'Deployment'],
  'setup': ['Configuration', 'DevOps'],
  'config': ['Configuration', 'Backend'],
  'integration': ['API Integration', 'Backend'],
  'upload': ['File Handling', 'Backend', 'Frontend'],
  'search': ['Backend', 'Database', 'Frontend'],
  'filter': ['Backend', 'Database', 'Frontend'],
  
  // Management modules
  'student': ['CRUD', 'Database', 'Backend', 'Frontend'],
  'teacher': ['CRUD', 'Database', 'Backend', 'Frontend'],
  'attendance': ['CRUD', 'Database', 'Backend', 'Frontend'],
  'management': ['CRUD', 'Database', 'Backend', 'Frontend'],
  'module': ['Backend', 'Frontend', 'Database'],
};

/**
 * Task type templates for AI subtask generation.
 */
const TASK_TEMPLATES = {
  authentication: {
    keywords: ['authentication', 'auth', 'login', 'register', 'signup'],
    subtasks: [
      { title: 'Design user schema', estimatedHours: 1 },
      { title: 'Create registration API endpoint', estimatedHours: 2 },
      { title: 'Create login API endpoint', estimatedHours: 2 },
      { title: 'Implement JWT token generation', estimatedHours: 1.5 },
      { title: 'Add authorization middleware', estimatedHours: 1.5 },
      { title: 'Create frontend login page', estimatedHours: 2 },
      { title: 'Create frontend registration page', estimatedHours: 2 },
      { title: 'Test authentication flow', estimatedHours: 1 },
    ],
  },
  crud_module: {
    keywords: ['management', 'module', 'crud', 'student', 'teacher', 'attendance'],
    subtasks: [
      { title: 'Design data model/schema', estimatedHours: 1 },
      { title: 'Create API endpoints (CRUD)', estimatedHours: 3 },
      { title: 'Add input validation', estimatedHours: 1 },
      { title: 'Create list/table view', estimatedHours: 2 },
      { title: 'Create add/edit form', estimatedHours: 2 },
      { title: 'Create detail view', estimatedHours: 1.5 },
      { title: 'Add search and filtering', estimatedHours: 1.5 },
      { title: 'Test module functionality', estimatedHours: 1 },
    ],
  },
  dashboard: {
    keywords: ['dashboard', 'analytics', 'chart', 'report', 'overview'],
    subtasks: [
      { title: 'Design dashboard layout', estimatedHours: 1 },
      { title: 'Create statistics API endpoints', estimatedHours: 2 },
      { title: 'Build summary stat cards', estimatedHours: 1.5 },
      { title: 'Implement charts and graphs', estimatedHours: 3 },
      { title: 'Add data filtering options', estimatedHours: 1.5 },
      { title: 'Make dashboard responsive', estimatedHours: 1 },
      { title: 'Test data accuracy', estimatedHours: 1 },
    ],
  },
  payment: {
    keywords: ['payment', 'gateway', 'transaction', 'billing', 'invoice'],
    subtasks: [
      { title: 'Design payment data model', estimatedHours: 1 },
      { title: 'Research and select payment provider', estimatedHours: 1 },
      { title: 'Implement payment API integration', estimatedHours: 3 },
      { title: 'Create payment form UI', estimatedHours: 2 },
      { title: 'Handle payment success/failure flows', estimatedHours: 2 },
      { title: 'Add transaction history', estimatedHours: 1.5 },
      { title: 'Implement security measures', estimatedHours: 1.5 },
      { title: 'Test payment scenarios', estimatedHours: 2 },
    ],
  },
  notification: {
    keywords: ['notification', 'alert', 'email', 'sms', 'messaging'],
    subtasks: [
      { title: 'Design notification schema', estimatedHours: 1 },
      { title: 'Create notification service', estimatedHours: 2 },
      { title: 'Build notification API', estimatedHours: 1.5 },
      { title: 'Create notification UI component', estimatedHours: 2 },
      { title: 'Add notification preferences', estimatedHours: 1 },
      { title: 'Test notification delivery', estimatedHours: 1 },
    ],
  },
  testing: {
    keywords: ['test', 'testing', 'qa', 'quality'],
    subtasks: [
      { title: 'Set up testing framework', estimatedHours: 1 },
      { title: 'Write unit tests for core logic', estimatedHours: 3 },
      { title: 'Write API integration tests', estimatedHours: 2 },
      { title: 'Write frontend component tests', estimatedHours: 2 },
      { title: 'Perform manual testing', estimatedHours: 2 },
      { title: 'Fix identified bugs', estimatedHours: 2 },
    ],
  },
  database: {
    keywords: ['database', 'schema', 'migration', 'data model'],
    subtasks: [
      { title: 'Analyze data requirements', estimatedHours: 1 },
      { title: 'Design database schema', estimatedHours: 2 },
      { title: 'Create Mongoose models', estimatedHours: 1.5 },
      { title: 'Add indexes for performance', estimatedHours: 0.5 },
      { title: 'Create seed/sample data', estimatedHours: 1 },
      { title: 'Test database operations', estimatedHours: 1 },
    ],
  },
  generic: {
    keywords: [],
    subtasks: [
      { title: 'Analyze requirements', estimatedHours: 1 },
      { title: 'Design solution', estimatedHours: 1.5 },
      { title: 'Implement backend logic', estimatedHours: 3 },
      { title: 'Implement frontend UI', estimatedHours: 3 },
      { title: 'Add input validation', estimatedHours: 1 },
      { title: 'Test functionality', estimatedHours: 1.5 },
    ],
  },
};

/**
 * Risk keyword patterns for local AI risk detection.
 */
const RISK_KEYWORDS = {
  high: [
    'security', 'payment', 'authentication', 'encryption', 'sensitive',
    'production', 'migration', 'breaking', 'critical', 'gateway',
  ],
  medium: [
    'integration', 'api', 'third-party', 'external', 'complex',
    'database', 'schema', 'refactor', 'performance',
  ],
  low: [
    'documentation', 'styling', 'ui', 'typo', 'label', 'text',
    'readme', 'comment',
  ],
};

module.exports = {
  AI_CONFIG,
  SKILL_KEYWORDS,
  TASK_TEMPLATES,
  RISK_KEYWORDS,
};
