import { useState } from 'react';
import { aiAPI } from '../services/api';

export default function AIAssistantPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  useState(() => {
    aiAPI.getStatus().then(res => setAiStatus(res.data.data)).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!title) return;
    setLoading(true);
    setAnalysis(null);
    setBreakdown(null);
    try {
      const res = await aiAPI.analyzeTask({ title, description });
      setAnalysis(res.data.data);
    } catch (err) {
      setAnalysis({ error: 'Analysis failed. Local engine will be used as fallback.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdown = async () => {
    if (!title) return;
    setLoading(true);
    setBreakdown(null);
    try {
      const res = await aiAPI.breakdownTask({ title, description });
      setBreakdown(res.data.data);
    } catch (err) {
      setBreakdown({ error: 'Breakdown failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🤖 AI Assistant</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Intelligent task analysis and breakdown
        </p>
        {aiStatus && (
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Active: {aiStatus.active} | Configured: {aiStatus.configured}
              {aiStatus.ollamaAvailable && ' | Ollama ✅'}
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="card mb-6">
        <div className="space-y-3">
          <div>
            <label>Task Title</label>
            <input className="input" placeholder="e.g., Build payment gateway" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label>Description (optional)</label>
            <textarea className="input" placeholder="Describe what the task involves..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !title}>
              {loading ? <span className="spinner" /> : '✨'} Analyze Task
            </button>
            <button className="btn btn-secondary" onClick={handleBreakdown} disabled={loading || !title}>
              📋 Break Down Task
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Result */}
      {analysis && !analysis.error && (
        <div className="card mb-6 animate-in">
          <h3 className="font-semibold mb-3">📊 Task Analysis</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Complexity</p>
              <p className="text-lg font-bold">{analysis.complexity}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Estimated Hours</p>
              <p className="text-lg font-bold">{analysis.estimatedHours}h</p>
            </div>
          </div>

          {analysis.requiredSkills?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.requiredSkills.map((s, i) => (
                  <span key={i} className="badge badge-info">{s}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.risks?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">⚠️ Potential Risks</p>
              <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                {analysis.risks.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          )}

          {analysis.reasoning && (
            <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg)' }}>
              <p className="text-xs font-medium mb-1">💡 Reasoning</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{analysis.reasoning}</p>
            </div>
          )}

          <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>Provider: {analysis.provider}</p>
        </div>
      )}

      {analysis?.error && (
        <div className="card mb-6 p-4" style={{ background: '#fffbeb' }}>
          <p className="text-sm" style={{ color: '#d97706' }}>⚠️ {analysis.error}</p>
        </div>
      )}

      {/* Breakdown Result */}
      {breakdown && !breakdown.error && (
        <div className="card animate-in">
          <h3 className="font-semibold mb-3">📋 Task Breakdown</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Total estimated: <strong>{breakdown.totalEstimatedHours}h</strong>
          </p>
          <div className="space-y-2">
            {breakdown.subtasks?.map((st, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{st.title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{st.estimatedHours}h · {st.complexity || 'MEDIUM'}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3 italic" style={{ color: 'var(--color-text-secondary)' }}>{breakdown.reasoning}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Provider: {breakdown.provider}</p>
        </div>
      )}
    </div>
  );
}
