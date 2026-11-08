const clampProgress = value => Math.min(100, Math.max(0, Number(value) || 0))

export function taskProgress(task) {
  if (task.status === 'done') return 100
  if (task.progressMode === 'auto' && task.checklist?.length) return Math.round(clampProgress(task.checklist.filter(item => item.done).length / task.checklist.length * 100))
  return clampProgress(task.progress)
}
export function withStatus(task, status) { return { ...task, status, progress: status === 'done' ? 100 : Math.min(99, taskProgress(task)), completedAt: status === 'done' ? new Date().toISOString() : null } }
export function withManualProgress(task, progress) { return { ...task, progressMode: 'manual', progress: Math.min(task.status === 'done' ? 100 : 99, Math.max(0, Number(progress))) } }
export function projectProgress(tasks, projectId) { const own=tasks.filter(t=>t.projectId===projectId); return own.length ? Math.round(clampProgress(own.reduce((sum,t)=>sum+taskProgress(t),0)/own.length)) : 0 }
