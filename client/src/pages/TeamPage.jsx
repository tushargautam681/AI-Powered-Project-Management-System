import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { getInitials } from '../utils/helpers';

export default function TeamPage() {
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.workload()
      .then(res => setWorkload(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><span className="spinner" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in">
      <h1 className="text-2xl font-bold mb-1">Team Workload</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Real-time workload distribution across team members
      </p>

      {workload.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workload.map(member => {
            const pct = Math.min(member.workloadPercentage || 0, 150);
            const barColor = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : pct > 50 ? '#6366f1' : '#22c55e';
            return (
              <div key={member._id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="avatar" style={{ background: '#8b5cf6' }}>
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{member.email}</p>
                  </div>
                </div>
                
                {/* Workload bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Workload</span>
                    <span className="font-medium" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg" style={{ background: 'var(--color-bg)' }}>
                    <p className="text-lg font-bold" style={{ color: '#6366f1' }}>{member.activeTasks}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Active</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: 'var(--color-bg)' }}>
                    <p className="text-lg font-bold">{member.totalEstimatedHours}h</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Hours</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: 'var(--color-bg)' }}>
                    <p className="text-lg font-bold" style={{ color: member.overdueTasks > 0 ? '#ef4444' : '#22c55e' }}>{member.overdueTasks}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Overdue</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-lg mb-2">👥</p>
          <p className="font-medium">No workload data</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Assign tasks to team members to see workload</p>
        </div>
      )}
    </div>
  );
}
