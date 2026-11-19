import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { projectAPI, analyticsAPI } from '../services/api';
import { STATUS_COLORS, PRIORITY_COLORS } from '../utils/helpers';

export default function AnalyticsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectAPI.getAll()
      .then(res => {
        setProjects(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedProject(res.data.data[0]._id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      analyticsAPI.project(selectedProject)
        .then(res => setAnalytics(res.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  if (loading && !analytics) return <div className="flex items-center justify-center h-full"><span className="spinner" /></div>;

  const statusData = analytics ? Object.entries(analytics.tasksByStatus).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
    fill: STATUS_COLORS[name] || '#94a3b8',
  })) : [];

  const priorityData = analytics ? Object.entries(analytics.tasksByPriority).map(([name, value]) => ({
    name,
    value,
    fill: PRIORITY_COLORS[name]?.text || '#666',
  })) : [];

  const CHART_COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Project performance insights</p>
        </div>
        <select className="select" style={{ width: 'auto' }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-3xl font-bold" style={{ color: '#6366f1' }}>{analytics.totalTasks}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Tasks</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold" style={{ color: '#22c55e' }}>{analytics.completedTasks}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Completed</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>{analytics.overdueTasks}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Overdue</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold" style={{ color: '#6366f1' }}>{analytics.projectProgress}%</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Progress</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Tasks by Status */}
            <div className="card">
              <h3 className="font-semibold mb-4">Tasks by Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tasks by Priority */}
            <div className="card">
              <h3 className="font-semibold mb-4">Tasks by Priority</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(analytics.riskDistribution || {}).map(([level, count]) => {
                const pc = PRIORITY_COLORS[level] || { bg: '#f1f5f9', text: '#666' };
                return (
                  <div key={level} className="text-center p-3 rounded-lg" style={{ background: pc.bg }}>
                    <p className="text-2xl font-bold" style={{ color: pc.text }}>{count}</p>
                    <p className="text-xs font-medium" style={{ color: pc.text }}>{level} RISK</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Tasks */}
          {analytics.criticalTasksList?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">⚠️ Critical Tasks</h3>
              <div className="space-y-2">
                {analytics.criticalTasksList.map(t => (
                  <div key={t._id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#fef2f2' }}>
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className="badge badge-critical">Score: {t.priorityScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
