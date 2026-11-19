import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, activityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PRIORITY_COLORS, formatDaysUntil, timeAgo, getInitials } from '../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, actRes] = await Promise.all([
        analyticsAPI.dashboard(),
        activityAPI.getAll({ limit: 8 }),
      ]);
      setStats(statsRes.data.data);
      setActivities(actRes.data.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><span className="spinner" /></div>;

  const statCards = [
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: '📋', color: '#6366f1' },
    { label: 'Active Tasks', value: stats?.activeTasks || 0, icon: '⚡', color: '#f59e0b' },
    { label: 'Completed', value: stats?.completedTasks || 0, icon: '✅', color: '#22c55e' },
    { label: 'Overdue', value: stats?.overdueTasks || 0, icon: '⚠️', color: '#ef4444' },
    { label: 'Critical', value: stats?.criticalTasks || 0, icon: '🔴', color: '#dc2626' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Here&apos;s what&apos;s happening with your projects
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${s.color}15` }}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommended Tasks */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🤖</span>
              <h2 className="font-semibold">AI Recommended Next Tasks</h2>
            </div>
            {stats?.recommendedTasks?.length > 0 ? (
              <div className="space-y-3">
                {stats.recommendedTasks.map((task, i) => {
                  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
                  return (
                    <Link
                      key={task._id}
                      to={`/projects/${task.projectId?._id || task.projectId}`}
                      className="flex items-start gap-3 p-3 rounded-lg border transition-colors hover:border-indigo-200"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold" style={{ background: pc.bg, color: pc.text }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{task.title}</span>
                          <span className="badge" style={{ background: pc.bg, color: pc.text }}>{task.priority}</span>
                          {task.riskLevel && task.riskLevel !== 'LOW' && (
                            <span className="badge badge-critical">Risk: {task.riskLevel}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <span>Score: <strong>{task.priorityScore}</strong></span>
                          {task.deadline && <span>📅 {formatDaysUntil(task.deadline)}</span>}
                          {task.projectId?.name && <span>📋 {task.projectId.name}</span>}
                          {task.assignedTo?.name && <span>👤 {task.assignedTo.name}</span>}
                        </div>
                        {task.priorityExplanation?.length > 0 && (
                          <p className="mt-1.5 text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
                            Why: {task.priorityExplanation[0]}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm py-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                No active tasks. Create a project and add tasks to get started!
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="card">
            <h2 className="font-semibold mb-4">Recent Activity</h2>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map(a => (
                  <div key={a._id} className="flex items-start gap-2.5">
                    <div className="avatar avatar-sm mt-0.5" style={{ background: '#8b5cf6', fontSize: '0.6rem' }}>
                      {getInitials(a.user?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium">{a.user?.name}</span>{' '}
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {formatAction(a.action)}
                        </span>{' '}
                        {a.metadata?.taskTitle && <span className="font-medium">{a.metadata.taskTitle}</span>}
                        {a.metadata?.projectName && <span className="font-medium">{a.metadata.projectName}</span>}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>No recent activity</p>
            )}
          </div>

          {/* Priority Distribution */}
          {stats?.tasksByPriority && (
            <div className="card mt-4">
              <h2 className="font-semibold mb-3">Priority Distribution</h2>
              <div className="space-y-2">
                {Object.entries(stats.tasksByPriority).map(([key, value]) => {
                  const pc = PRIORITY_COLORS[key] || {};
                  const total = Object.values(stats.tasksByPriority).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs w-16 font-medium" style={{ color: pc.text }}>{key}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: '#f1f5f9' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pc.text }} />
                      </div>
                      <span className="text-xs font-medium w-6 text-right" style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAction(action) {
  const map = {
    TASK_CREATED: 'created task',
    TASK_UPDATED: 'updated task',
    TASK_DELETED: 'deleted task',
    TASK_ASSIGNED: 'assigned task',
    TASK_STATUS_CHANGED: 'changed status of',
    TASK_PRIORITY_UPDATED: 'updated priority of',
    PROJECT_CREATED: 'created project',
    PROJECT_UPDATED: 'updated project',
    PROJECT_DELETED: 'deleted project',
    MEMBER_ADDED: 'added member to',
    MEMBER_REMOVED: 'removed member from',
    AI_ANALYSIS_GENERATED: 'ran AI analysis on',
  };
  return map[action] || action.toLowerCase().replace(/_/g, ' ');
}
