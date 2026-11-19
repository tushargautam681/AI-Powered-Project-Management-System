import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/helpers';

const STATUS_BADGE = {
  PLANNING: { bg: '#eff6ff', color: '#2563eb' },
  ACTIVE: { bg: '#f0fdf4', color: '#16a34a' },
  ON_HOLD: { bg: '#fffbeb', color: '#d97706' },
  COMPLETED: { bg: '#f0fdf4', color: '#15803d' },
};

export default function ProjectsPage() {
  const { isManager } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', deadline: '', status: 'PLANNING' });

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await projectAPI.create(form);
      setShowForm(false);
      setForm({ name: '', description: '', deadline: '', status: 'PLANNING' });
      loadProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><span className="spinner" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{projects.length} project(s)</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            ➕ New Project
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card mb-6 animate-in">
          <h3 className="font-semibold mb-3">Create Project</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input className="input" placeholder="Project name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            <textarea className="input" placeholder="Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Deadline</label>
                <input className="input" type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))} />
              </div>
              <div>
                <label>Status</label>
                <select className="select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">Create</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Project List */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => {
            const sb = STATUS_BADGE[p.status] || STATUS_BADGE.PLANNING;
            const progress = p.taskCounts?.total > 0
              ? Math.round((p.taskCounts.DONE / p.taskCounts.total) * 100)
              : 0;
            return (
              <Link key={p._id} to={`/projects/${p._id}`} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="badge" style={{ background: sb.bg, color: sb.color }}>{p.status}</span>
                </div>
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{p.description || 'No description'}</p>
                
                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--color-primary)' }} />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>📋 {p.taskCounts?.total || 0} tasks</span>
                  <span>👥 {p.members?.length || 0} members</span>
                  <span>📅 {formatDate(p.deadline)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-lg mb-2">📋</p>
          <p className="font-medium">No projects yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Create your first project to get started</p>
        </div>
      )}
    </div>
  );
}
