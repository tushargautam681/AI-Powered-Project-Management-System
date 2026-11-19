import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { projectAPI, taskAPI, aiAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PRIORITY_COLORS, STATUS_LABELS, STATUS_COLORS, formatDaysUntil, getInitials, formatDate } from '../utils/helpers';

const COLUMNS = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { isManager, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [priorityResult, setPriorityResult] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [projRes, taskRes, usersRes] = await Promise.all([
        projectAPI.getById(projectId),
        taskAPI.getAll({ projectId }),
        authAPI.getUsers(),
      ]);
      setProject(projRes.data.data);
      setTasks(taskRes.data.data);
      setAllUsers(usersRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Drag and drop
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    // Optimistic update
    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));
    
    try {
      await taskAPI.updateStatus(draggableId, newStatus);
    } catch (err) {
      console.error(err);
      loadData(); // Revert on error
    }
  };

  // Group tasks by status, sorted by priority
  const columns = {};
  COLUMNS.forEach(col => {
    columns[col] = tasks
      .filter(t => t.status === col)
      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0) || new Date(a.deadline || '9999') - new Date(b.deadline || '9999'));
  });

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assignedTo: '', businessImpact: 'MEDIUM',
    complexity: 'MEDIUM', deadline: '', estimatedHours: '', dependencies: [], tags: '',
  });

  const resetForm = () => {
    setTaskForm({
      title: '', description: '', assignedTo: '', businessImpact: 'MEDIUM',
      complexity: 'MEDIUM', deadline: '', estimatedHours: '', dependencies: [], tags: '',
    });
    setEditingTask(null);
    setAiResult(null);
    setPriorityResult(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...taskForm,
        projectId,
        estimatedHours: Number(taskForm.estimatedHours) || 0,
        tags: taskForm.tags ? taskForm.tags.split(',').map(t => t.trim()) : [],
        assignedTo: taskForm.assignedTo || undefined,
      };
      
      if (editingTask) {
        await taskAPI.update(editingTask._id, data);
      } else {
        await taskAPI.create(data);
      }
      
      setShowTaskForm(false);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleEditTask = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      businessImpact: task.businessImpact || 'MEDIUM',
      complexity: task.complexity || 'MEDIUM',
      deadline: task.deadline ? task.deadline.slice(0, 10) : '',
      estimatedHours: task.estimatedHours || '',
      dependencies: task.dependencies?.map(d => d._id || d) || [],
      tags: task.tags?.join(', ') || '',
    });
    setEditingTask(task);
    setShowTaskForm(true);
    setAiResult(null);
    setPriorityResult(null);
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  // AI Analysis
  const handleAIAnalyze = async () => {
    setAiLoading(true);
    try {
      const data = editingTask
        ? { taskId: editingTask._id }
        : { title: taskForm.title, description: taskForm.description, businessImpact: taskForm.businessImpact, complexity: taskForm.complexity };
      const res = await aiAPI.analyzeTask(data);
      setAiResult(res.data.data);
    } catch (err) {
      setAiResult({ error: 'AI analysis unavailable. Using local intelligent analysis.' });
    } finally {
      setAiLoading(false);
    }
  };

  // Calculate Priority
  const handleCalculatePriority = async (taskId) => {
    try {
      const res = await taskAPI.prioritize(taskId);
      setPriorityResult(res.data.data);
      loadData();
    } catch (err) {
      alert('Failed to calculate priority');
    }
  };

  // Reprioritize all
  const handleReprioritize = async () => {
    try {
      await taskAPI.reprioritizeProject(projectId);
      loadData();
    } catch (err) {
      alert('Reprioritization failed');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><span className="spinner" /></div>;
  if (!project) return <div className="flex items-center justify-center h-full"><p>Project not found</p></div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {tasks.length} tasks · {project.members?.length || 0} members
            </p>
          </div>
          <div className="flex gap-2">
            {isManager && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={handleReprioritize}>🔄 Reprioritize All</button>
                <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowTaskForm(true); }}>➕ New Task</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={(e) => { if (e.target === e.currentTarget) { setShowTaskForm(false); resetForm(); } }}>
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">{editingTask ? 'Edit Task' : 'Create Task'}</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label>Title</label>
                <input className="input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm(f => ({...f, title: e.target.value}))} required />
              </div>
              <div>
                <label>Description</label>
                <textarea className="input" placeholder="Describe the task..." value={taskForm.description} onChange={e => setTaskForm(f => ({...f, description: e.target.value}))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Assigned To</label>
                  <select className="select" value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({...f, assignedTo: e.target.value}))}>
                    <option value="">Unassigned</option>
                    {allUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Deadline</label>
                  <input className="input" type="date" value={taskForm.deadline} onChange={e => setTaskForm(f => ({...f, deadline: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label>Business Impact</label>
                  <select className="select" value={taskForm.businessImpact} onChange={e => setTaskForm(f => ({...f, businessImpact: e.target.value}))}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label>Complexity</label>
                  <select className="select" value={taskForm.complexity} onChange={e => setTaskForm(f => ({...f, complexity: e.target.value}))}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label>Estimated Hours</label>
                  <input className="input" type="number" placeholder="0" value={taskForm.estimatedHours} onChange={e => setTaskForm(f => ({...f, estimatedHours: e.target.value}))} min="0" />
                </div>
              </div>
              <div>
                <label>Tags (comma separated)</label>
                <input className="input" placeholder="api, backend, security" value={taskForm.tags} onChange={e => setTaskForm(f => ({...f, tags: e.target.value}))} />
              </div>
              <div>
                <label>Dependencies</label>
                <select className="select" multiple value={taskForm.dependencies} onChange={e => setTaskForm(f => ({...f, dependencies: Array.from(e.target.selectedOptions, o => o.value)}))}>
                  {tasks.filter(t => t._id !== editingTask?._id).map(t => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Hold Ctrl to select multiple</p>
              </div>

              {/* AI Analysis Section */}
              <div className="border rounded-lg p-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">🤖 AI Analysis</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleAIAnalyze}
                    disabled={aiLoading || !taskForm.title}
                  >
                    {aiLoading ? <span className="spinner" /> : '✨ Analyze with AI'}
                  </button>
                </div>
                {aiResult && !aiResult.error && (
                  <div className="space-y-2 text-xs animate-in">
                    <div className="flex gap-4">
                      <span><strong>Complexity:</strong> {aiResult.complexity}</span>
                      <span><strong>Est. Hours:</strong> {aiResult.estimatedHours}h</span>
                    </div>
                    {aiResult.requiredSkills?.length > 0 && (
                      <div><strong>Skills:</strong> {aiResult.requiredSkills.join(', ')}</div>
                    )}
                    {aiResult.risks?.length > 0 && (
                      <div><strong>Risks:</strong> {aiResult.risks.map((r, i) => <span key={i} className="block ml-2">• {r}</span>)}</div>
                    )}
                    {aiResult.reasoning && <div className="italic" style={{ color: 'var(--color-text-secondary)' }}>{aiResult.reasoning}</div>}
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Provider: {aiResult.provider}</p>
                  </div>
                )}
                {aiResult?.error && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>⚠️ {aiResult.error}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button className="btn btn-primary" type="submit">{editingTask ? 'Update' : 'Create'} Task</button>
                {editingTask && (
                  <button type="button" className="btn btn-secondary" onClick={() => handleCalculatePriority(editingTask._id)}>
                    🎯 Calculate Priority
                  </button>
                )}
                <button className="btn btn-ghost" type="button" onClick={() => { setShowTaskForm(false); resetForm(); }}>Cancel</button>
              </div>
            </form>

            {/* Priority Result */}
            {priorityResult && (
              <div className="mt-4 p-3 border rounded-lg animate-in" style={{ borderColor: 'var(--color-border)' }}>
                <h4 className="font-semibold text-sm mb-2">🎯 Priority Calculation</h4>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold" style={{ color: PRIORITY_COLORS[priorityResult.priority?.category]?.text }}>
                    {priorityResult.priority?.score}
                  </span>
                  <span className="badge" style={{
                    background: PRIORITY_COLORS[priorityResult.priority?.category]?.bg,
                    color: PRIORITY_COLORS[priorityResult.priority?.category]?.text,
                  }}>
                    {priorityResult.priority?.category}
                  </span>
                  <span className="badge" style={{
                    background: PRIORITY_COLORS[priorityResult.risk?.level]?.bg || '#f1f5f9',
                    color: PRIORITY_COLORS[priorityResult.risk?.level]?.text || '#666',
                  }}>
                    Risk: {priorityResult.risk?.level}
                  </span>
                </div>
                {priorityResult.priority?.factors && (
                  <div className="grid grid-cols-5 gap-2 text-xs mb-2">
                    {Object.entries(priorityResult.priority.factors).map(([k, v]) => (
                      <div key={k} className="text-center p-1.5 rounded" style={{ background: 'var(--color-bg)' }}>
                        <div className="font-bold">{v}</div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>{k}</div>
                      </div>
                    ))}
                  </div>
                )}
                {priorityResult.priority?.explanation?.length > 0 && (
                  <div className="text-xs space-y-0.5">
                    {priorityResult.priority.explanation.map((e, i) => (
                      <p key={i}>• {e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto px-4 py-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(col => (
              <div key={col} className="w-72 flex flex-col rounded-xl" style={{ background: '#f1f5f9' }}>
                {/* Column Header */}
                <div className="px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[col] }} />
                    <span className="text-sm font-semibold">{STATUS_LABELS[col]}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#e2e8f0', color: '#64748b' }}>
                      {columns[col]?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto"
                      style={{
                        minHeight: 100,
                        background: snapshot.isDraggingOver ? 'rgba(99,102,241,0.05)' : 'transparent',
                        borderRadius: '0 0 0.75rem 0.75rem',
                        transition: 'background 200ms',
                      }}
                    >
                      {(columns[col] || []).map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={!isManager && user?.role !== 'DEVELOPER'}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="card p-3 cursor-grab active:cursor-grabbing"
                              style={{
                                ...provided.draggableProps.style,
                                boxShadow: snapshot.isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                                transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} rotate(2deg)` : provided.draggableProps.style?.transform,
                              }}
                              onClick={() => isManager && handleEditTask(task)}
                            >
                              {/* Title + Priority */}
                              <div className="flex items-start justify-between gap-1 mb-2">
                                <span className="font-medium text-sm leading-tight">{task.title}</span>
                              </div>

                              {/* Badges */}
                              <div className="flex items-center flex-wrap gap-1 mb-2">
                                <span className="badge" style={{
                                  background: PRIORITY_COLORS[task.priority]?.bg,
                                  color: PRIORITY_COLORS[task.priority]?.text,
                                }}>
                                  {task.priority} · {task.priorityScore}
                                </span>
                                {task.riskLevel && task.riskLevel !== 'LOW' && (
                                  <span className="badge badge-critical" style={{ fontSize: '0.625rem' }}>
                                    ⚠ {task.riskLevel}
                                  </span>
                                )}
                              </div>

                              {/* Meta row */}
                              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                <div className="flex items-center gap-2">
                                  {task.assignedTo && (
                                    <div className="avatar avatar-sm" style={{ background: '#8b5cf6', width: '1.25rem', height: '1.25rem', fontSize: '0.5rem' }}>
                                      {getInitials(task.assignedTo.name)}
                                    </div>
                                  )}
                                  {task.deadline && (
                                    <span className={task.isOverdue ? 'font-medium' : ''} style={task.isOverdue ? { color: 'var(--color-danger)' } : {}}>
                                      📅 {formatDaysUntil(task.deadline)}
                                    </span>
                                  )}
                                </div>
                                {task.dependencyCount > 0 && (
                                  <span>🔗 {task.dependencyCount}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
