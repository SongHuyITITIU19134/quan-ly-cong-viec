import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Header, Page } from '@/app/App'
import { Button, Drawer, LoadingState, Modal, Popover, PriorityBadge, StatusBadge } from '@/components/ui'
import TaskForm from '@/components/task/TaskForm'
import TagFilter from '@/components/tags/TagFilter'
import { useActions, useDataState, useToast } from '@/hooks/useData'
import { PRIORITY_KEYS, STATUS_KEYS, vi } from '@/i18n/vi'
import { todayISO } from '@/lib/dates'
import { parseQuickAdd } from '@/lib/quickAdd'
import KanbanView from './KanbanView'
import ListView from './ListView'
import ProjectsView from './ProjectsView'
import { useTaskActions } from './useTaskActions'
import { useTaskFilters } from './useTaskFilters'
export default function TasksPage() {
  const {
      data,
      loading,
      tagCatalog = [],
      tagRegistry = {
        c: {}
      }
    } = useDataState(),
    {
      create,
      update,
      batch
    } = useActions(),
    toast = useToast()
  const [params, setParams] = useSearchParams(),
    [view, setView] = useState(params.get('view') || 'kanban')
  const [editing, setEditing] = useState(params.get('new') === 'task' ? {} : null),
    [confirm, setConfirm] = useState(null)
  const [projectEditing, setProjectEditing] = useState(null),
    [projectConfirm, setProjectConfirm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(''),
    [moveTarget, setMoveTarget] = useState(''),
    [quickText, setQuickText] = useState('')
  const filters = useTaskFilters(data, params, setParams),
    quickParsed = useMemo(() => parseQuickAdd(quickText, todayISO()), [quickText])
  const actions = useTaskActions({
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
    tagFilters: filters.tagFilters,
    toggleParamValue: filters.toggleParamValue
  })
  const selectedProject = data.projects.find(project => project.id === params.get('project')),
    taskFormId = 'task-editor-form'
  useEffect(() => {
    if (params.get('new') === 'task') setEditing(current => current || {})
    if (params.get('new') === 'project') setProjectEditing(current => current || {})
  }, [params])
  useEffect(() => {
    const fn = event => {
      if ((event.key === 'n' || event.key === 'N') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        event.preventDefault()
        setEditing({})
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])
  if (loading) return <Page>
<LoadingState />
</Page>
  return <Page>
    <Header title={vi.nav.tasks} description={vi.generated.TasksPage_90_0(filters.filtered.length)} action={<Button icon={Plus} onClick={() => {
      const next = new URLSearchParams(params)
      next.set('new', '1')
      setParams(next)
    }}>{vi.action.create}</Button>} />
    <span className="sr-only" data-render-complete="true">{vi.generated.TasksPage_95_1}{filters.filtered.length}{vi.generated.TasksPage_96_2}</span>
    <div className="quick-add-task">
<label htmlFor="task-quick-add">{vi.generated.TasksPage_99_3}</label>
<input
  id="task-quick-add"
  value={quickText}
  onChange={event=>setQuickText(event.target.value)}
  onKeyDown={actions.quickAdd}
  placeholder={vi.generated.TasksPage_105_4}
/>
{quickText&&<small className="field-hint">{vi.generated.TasksPage_107_5}{quickParsed.title||vi.generated.TasksPage_108_6}
  {quickParsed.dueDate?` · ${quickParsed.dueDate}`:''}
  {quickParsed.tags.length?` · #${quickParsed.tags.join(' #')}`:''} · {vi.priority[quickParsed.priority]}
</small>}</div>
    <div className="underline-tabs task-view-tabs" role="tablist" aria-label={vi.generated.TasksPage_112_7}>
<button className="underline-tab" role="tab" aria-selected={view === 'kanban'} onClick={() => setView('kanban')}>Kanban</button>
<button className="underline-tab" role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>{vi.generated.TasksPage_114_8}</button>
<button className="underline-tab" role="tab" aria-selected={view === 'projects'} onClick={() => setView('projects')}>{vi.generated.TasksPage_115_9}</button>
</div>
    <div className="toolbar">
<div className="search">
<Search size={18} />
<input
  id="task-search"
  value={filters.searchInput}
  onChange={event=>filters.setSearchInput(event.target.value)}
  placeholder={vi.generated.TasksPage_124_10}
  aria-label={vi.generated.TasksPage_125_11}
/>
</div>
<Popover
  className="filter-menu"
  panelClassName="filter-panel"
  role="dialog"
  label={<>{vi.generated.TasksPage_132_12}{filters.status.length?` (${filters.status.length})`:''}</>}
>
<fieldset>
<legend className="sr-only">{vi.generated.TasksPage_135_13}</legend>{STATUS_KEYS.map(key => <label key={key}>
<input type="checkbox" checked={filters.status.includes(key)} onChange={() => filters.toggleParamValue('status', filters.status, key)} />
<StatusBadge value={key} />
</label>)}</fieldset>
</Popover>
<Popover
  className="filter-menu"
  panelClassName="filter-panel"
  role="dialog"
  label={<>{vi.generated.TasksPage_144_14}{filters.priority.length?` (${filters.priority.length})`:''}</>}
>
<fieldset>
<legend className="sr-only">{vi.generated.TasksPage_147_15}</legend>{PRIORITY_KEYS.map(key => <label key={key}>
<input type="checkbox" checked={filters.priority.includes(key)} onChange={() => filters.toggleParamValue('priority', filters.priority, key)} />
<PriorityBadge value={key} />
</label>)}</fieldset>
</Popover>
<TagFilter
  catalog={tagCatalog}
  selected={filters.tagFilters}
  onToggle={actions.toggleTag}
  onClear={()=>filters.changeParam('tags','')}
  onReplace={keys=>filters.changeParam('tags',keys.join(','))}
/>
<select aria-label={vi.generated.TasksPage_159_16} value={filters.projectId} onChange={event => filters.changeParam('projectId', event.target.value)}>
<option value="">{vi.generated.TasksPage_160_17}{data.tasks.length})</option>
{data.projects.filter(project=>actions.projectStatus(project)!=='archived').map(project=><option
  key={project.id}
  value={project.id}
>{project.name} ({data.tasks.filter(task=>task.projectId===project.id).length})</option>)}</select>
<select aria-label={vi.generated.TasksPage_165_18} value={filters.sort} onChange={event => filters.changeParam('sort', event.target.value)}>
<option value="order">{vi.generated.TasksPage_166_19}</option>
<option value="dueDate">{vi.generated.TasksPage_167_20}</option>
<option value="priority">{vi.generated.TasksPage_168_21}</option>
</select>{filters.hasFilters&&filters.filtered.length>0&&<Button
  variant="secondary"
  icon={SlidersHorizontal}
  onClick={()=>setParams({})}
>{vi.generated.TasksPage_173_22}</Button>}</div>
    <p className="sr-only" aria-live="polite">{actions.announcement}</p>
    {view==='kanban'&&<KanbanView
      data={data} filtered={filters.filtered} grouped={filters.grouped} hasFilters={filters.hasFilters}
      setParams={setParams} taskProps={actions.taskProps} changeStatus={actions.changeStatus}
      dropTask={actions.dropTask} setDragging={actions.setDragging} setEditing={setEditing}
    />}
    {view==='list'&&<ListView
      data={data} filtered={filters.filtered} tagRegistry={tagRegistry} tagFilters={filters.tagFilters}
      toggleTag={actions.toggleTag} changeStatus={actions.changeStatus} setEditing={setEditing}
      setConfirm={setConfirm} setParams={setParams}
    />}
    <ProjectsView
      active={view==='projects'} editing={editing} data={data} loading={loading}
      projectStatus={actions.projectStatus} changeParam={filters.changeParam} setView={setView}
      projectEditing={projectEditing} setProjectEditing={setProjectEditing}
      projectConfirm={projectConfirm} setProjectConfirm={setProjectConfirm}
      deleteTarget={deleteTarget} setDeleteTarget={setDeleteTarget}
      moveTarget={moveTarget} setMoveTarget={setMoveTarget} selectedProject={selectedProject}
      setEditing={setEditing} saveProject={actions.saveProject} archiveProject={actions.archiveProject}
      deleteProject={actions.deleteProject} moveProjectTasks={actions.moveProjectTasks}
    />
    {editing && <Drawer title={editing.id ? vi.generated.TasksPage_195_23 : vi.generated.TasksPage_195_24} onClose={actions.closeEditor} actions={<>
<Button variant="secondary" onClick={actions.closeEditor}>{vi.generated.TasksPage_196_25}</Button>
<Button type="submit" form={taskFormId}>{vi.generated.TasksPage_197_26}</Button>
</>}>
<TaskForm
  formId={taskFormId} showActions={false} task={editing} projects={data.projects}
  contacts={data.contacts} trips={data.trips} tagCatalog={tagCatalog} tagRegistry={tagRegistry}
  onQuickProject={actions.quickProject} onSave={actions.save} onCancel={actions.closeEditor}
/>
{editing.id&&<Button variant="danger" icon={Trash2} onClick={()=>setConfirm(editing)}>{vi.generated.TasksPage_204_27}</Button>}</Drawer>}
    {confirm && <Modal title={vi.generated.TasksPage_207_28} onClose={() => setConfirm(null)} actions={<>
<Button variant="secondary" onClick={() => setConfirm(null)}>{vi.generated.TasksPage_208_29}</Button>
<Button variant="danger" onClick={actions.deleteTask}>{vi.generated.TasksPage_209_30}</Button>
</>}>
<p>{vi.generated.TasksPage_211_31}<span className="modal-long-title" title={confirm.title}>“{confirm.title}”</span>
{vi.generated.TasksPage_212_32}{' '}{vi.generated.TasksPage_213_33}</p>
</Modal>}
  </Page>
}
