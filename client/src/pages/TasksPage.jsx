import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PRIORITY_COLORS, formatDaysUntil, getInitials } from '../utils/helpers';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const params = {};
    if (user?.role === 'DEVELOPER') params.assignedTo = user._id;
    taskAPI.getAll(params)
      .then(res => setTasks(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return <div className="flex items-center justify-center h-full"><span className="spinner" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in">
      <h1 className="text-2xl font-bold mb-1">My Tasks</h1>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{filtered.length} task(s)</p>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(task => {
            const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
            return (
              <Link
                key={task._id}
                to={`/projects/${task.projectId?._id || task.projectId}`}
                className="card flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: pc.bg, color: pc.text }}>
                  {task.priorityScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.title}</span>
                    <span className="badge" style={{ background: pc.bg, color: pc.text }}>{task.priority}</span>
                    {task.riskLevel !== 'LOW' && <span className="badge badge-critical">⚠ {task.riskLevel}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {task.deadline && <span>📅 {formatDaysUntil(task.deadline)}</span>}
                    {task.assignedTo?.name && <span>👤 {task.assignedTo.name}</span>}
                    <span>📊 {task.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-lg mb-2">✅</p>
          <p className="font-medium">No tasks found</p>
        </div>
      )}
    </div>
  );
}
