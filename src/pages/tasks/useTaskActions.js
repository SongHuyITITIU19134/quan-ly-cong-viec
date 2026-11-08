import { useState } from 'react'
import { vi } from '@/i18n/vi'
import { todayISO } from '@/lib/dates'
import { buildDeleteOps, buildRestoreOps } from '@/lib/relations'
import { moveTaskOps } from '@/lib/order'
import { recurrenceCreateOp, recurrenceUndoOp } from '@/lib/recurrence'
import { normalizeTags } from '@/tags/tagUtils'
import { getProjectEffectiveStatus } from '@/lib/projectStatus'
import { projectDeleteOps } from '@/lib/projects'
export function useTaskActions({
  data,
  loading,
  create,
  update,
  batch,
  toast,
  params,
  setParams,
  editing,
  setEditing,
  confirm,
  setConfirm,
  projectEditing,
  setProjectEditing,
  projectConfirm,
  setProjectConfirm,
  deleteTarget,
  setDeleteTarget,
  moveTarget,
  setMoveTarget,
  quickParsed,
  setQuickText,
  tagRegistry,
  tagFilters,
  toggleParamValue
}) {
  const [dragging, setDragging] = useState(''),
    [announcement, setAnnouncement] = useState('')
  const projectStatus = project => getProjectEffectiveStatus(project, data.tasks, {
    loading
  })
  const closeEditor = () => {
    setEditing(null)
    const next = new URLSearchParams(params)
    next.delete('new')
    setParams(next)
  }
  const save = async form => {
    const id = editing?.id || crypto.randomUUID(),
      result = await batch([{
        type: editing?.id ? 'update' : 'create',
        collection: 'tasks',
        id,
        data: {
          ...form,
          id,
          ...(form.repeat ? {
            seriesId: form.seriesId || id
          } : {}),
          order: editing?.id ? form.order : data.tasks.length + 1
        }
      }])
    if (!result) return
    toast('Đã lưu nhiệm vụ thành công.')
    closeEditor()
  }
  const changeStatus = async (task, nextStatus, targetIndex) => {
    const statusOps = moveTaskOps(data.tasks, task.id, nextStatus, targetIndex),
      created = nextStatus === 'done' ? recurrenceCreateOp(task, data.tasks) : null,
      ops = created ? [...statusOps, created] : statusOps,
      undo = ops.map(op => op.type === 'create' ? recurrenceUndoOp(op) : {
        type: 'update',
        collection: 'tasks',
        id: op.id,
        data: data.tasks.find(item => item.id === op.id)
      })
    if (!(await batch(ops))) return
    const message = `Đã chuyển ${task.title} sang ${vi.status[nextStatus]}.`
    setAnnouncement(message)
    toast(message, {
      label: vi.action.undo,
      onClick: () => batch(undo)
    })
  }
  const dropTask = (event, status, index) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/task-id') || dragging,
      task = data.tasks.find(item => item.id === taskId)
    setDragging('')
    if (task) changeStatus(task, status, index)
  }
  const deleteTask = async () => {
    const ops = buildDeleteOps('task', confirm.id, data),
      undo = buildRestoreOps(ops, data)
    if (!(await batch(ops))) return
    setConfirm(null)
    closeEditor()
    toast('Đã xóa nhiệm vụ.', {
      label: vi.action.undo,
      onClick: () => batch(undo)
    })
  }
  const saveProject = async form => {
    const result = projectEditing?.id ? await update('projects', projectEditing.id, form) : await create('projects', form)
    if (!result) return
    toast('Đã lưu dự án.')
    setProjectEditing(null)
  }
  const quickProject = async () => {
    const name = window.prompt('Tên dự án mới')
    if (!name?.trim()) return null
    const result = await create('projects', {
      name: name.trim(),
      description: '',
      colorIndex: data.projects.length % 8 + 1,
      status: 'running',
      ownerId: '',
      startDate: '',
      dueDate: '',
      archived: false
    })
    if (result) toast('Đã tạo và chọn dự án mới.')
    return result
  }
  const archiveProject = async project => {
    const archived = project.status !== 'archived'
    await update('projects', project.id, {
      status: archived ? 'archived' : 'running',
      archived
    })
    toast(archived ? 'Đã lưu trữ dự án.' : 'Đã khôi phục dự án.')
  }
  const deleteProject = async () => {
    const project = projectConfirm,
      baseOps = buildDeleteOps('project', project.id, data),
      ops = baseOps.map(op => deleteTarget && op.collection === 'tasks' && op.type === 'update' && op.data.projectId === null ? {
        ...op,
        data: {
          ...op.data,
          projectId: deleteTarget
        }
      } : op),
      undo = buildRestoreOps(ops, data)
    if (!(await batch(ops))) return
    setProjectConfirm(null)
    setDeleteTarget('')
    const next = new URLSearchParams(params)
    next.delete('project')
    setParams(next)
    toast('Đã xóa dự án và cập nhật nhiệm vụ.', {
      label: 'Hoàn tác',
      onClick: () => batch(undo)
    })
  }
  const moveProjectTasks = async selectedProject => {
    if (!selectedProject || !moveTarget) return
    const ops = projectDeleteOps(selectedProject.id, data.tasks, moveTarget)
    if (!ops.length) return toast('Dự án chưa có nhiệm vụ để chuyển.')
    if (await batch(ops)) {
      toast(`Đã chuyển ${ops.length} nhiệm vụ.`)
      setMoveTarget('')
    }
  }
  const toggleTag = key => toggleParamValue('tags', tagFilters, key)
  const quickAdd = async event => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || !quickParsed.title) return
    event.preventDefault()
    const id = crypto.randomUUID(),
      saved = await batch([{
        type: 'create',
        collection: 'tasks',
        id,
        data: {
          id,
          title: quickParsed.title,
          description: '',
          projectId: null,
          status: 'todo',
          priority: quickParsed.priority,
          startDate: todayISO(),
          dueDate: quickParsed.dueDate,
          assignerId: '',
          assigneeId: 'self',
          collaboratorIds: [],
          notes: '',
          checklist: [],
          progress: 0,
          progressMode: 'auto',
          tripId: null,
          tripPhase: null,
          order: data.tasks.length + 1,
          tags: normalizeTags(quickParsed.tags)
        }
      }])
    if (saved) {
      setQuickText('')
      toast('Đã thêm nhanh nhiệm vụ.')
    }
  }
  const taskProps = task => {
    const projectIndex = data.projects.findIndex(project => project.id === task.projectId)
    return {
      task,
      project: data.projects[projectIndex],
      projectIndex,
      contact: data.contacts.find(contact => contact.id === task.assigneeId),
      tagRegistry,
      selectedTags: tagFilters,
      onTagToggle: toggleTag,
      onOpen: () => setEditing(task),
      onStatus: next => changeStatus(task, next),
      onToggle: () => changeStatus(task, task.status === 'done' ? 'todo' : 'done')
    }
  }
  return {
    announcement,
    setDragging,
    projectStatus,
    closeEditor,
    save,
    changeStatus,
    dropTask,
    deleteTask,
    saveProject,
    quickProject,
    archiveProject,
    deleteProject,
    moveProjectTasks,
    toggleTag,
    quickAdd,
    taskProps
  }
}
