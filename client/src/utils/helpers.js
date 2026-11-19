/**
 * Shared utility functions for the client.
 */

export const PRIORITY_COLORS = {
  CRITICAL: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  HIGH: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  MEDIUM: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  LOW: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
};

export const STATUS_LABELS = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export const STATUS_COLORS = {
  BACKLOG: '#94a3b8',
  TODO: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  IN_REVIEW: '#8b5cf6',
  DONE: '#22c55e',
};

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function daysUntil(date) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDaysUntil(date) {
  const days = daysUntil(date);
  if (days === null) return '—';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
