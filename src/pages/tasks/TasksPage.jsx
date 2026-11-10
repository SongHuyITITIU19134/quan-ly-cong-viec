import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Page } from '@/app/App'
import { Button, Chip, Drawer, LoadingState, Modal, Popover, PriorityBadge, StatusBadge } from '@/components/ui'
import TaskForm from '@/components/task/TaskForm'
import TagFilter from '@/components/tags/TagFilter'
import { useActions, useAuth, useDataState, useToast } from '@/hooks/useData'
import { PRIORITY_KEYS, STATUS_KEYS, vi } from '@/i18n/vi'
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
    toast = useToast(),
    {readOnly}=useAuth()
  const [params, setParams] = useSearchParams(),
    [view, setView] = useState(params.get('view') || 'kanban')
  const [editing, setEditing] = useState(null),
    [confirm, setConfirm] = useState(null)
  const [projectEditing, setProjectEditing] = useState(null),
    [projectConfirm, setProjectConfirm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(''),
    [moveTarget, setMoveTarget] = useState('')
  const filters = useTaskFilters(data, params, setParams)
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
    tagRegistry,
    tagFilters: filters.tagFilters,
    toggleParamValue: filters.toggleParamValue
  })
  const selectedProject = data.projects.find(project => project.id === params.get('project')),
    taskFormId = 'task-editor-form'
  const onReadOnly=useCallback(()=>toast(vi.auth.verifyToEdit),[toast])
  const openTask=useCallback(()=>readOnly?onReadOnly():setEditing({}),[onReadOnly,readOnly])
  const openEditor=value=>value?.id?setEditing(value):openTask()
  const openCreate=mode=>window.setTimeout(()=>window.dispatchEvent(new CustomEvent('nhip-viec-create',{detail:mode})),0)
  const blockedCreateProps=readOnly?{'aria-disabled':true,title:vi.auth.verifyToEdit}:{}
  const changeView = nextView => {
    setView(nextView)
    const next = new URLSearchParams(params)
    nextView === 'kanban' ? next.delete('view') : next.set('view', nextView)
    setParams(next)
  }
  useEffect(() => {
    const target=params.get('new')
    if (!['task','project'].includes(target))return
    if(readOnly)onReadOnly()
    else if(target==='task')setEditing(current=>current||{})
    else setProjectEditing(current=>current||{})
    const next=new URLSearchParams(params);next.delete('new');setParams(next,{replace:true})
  }, [onReadOnly,params,readOnly,setParams])
  useEffect(() => {
    const fn = event => {
      if ((event.key === 'n' || event.key === 'N') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        event.preventDefault()
        openTask()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [openTask])
  if (loading) return <Page>
<LoadingState />
</Page>
  return <Page>
    <header className="tasks-page-head">
<div><h1>{vi.nav.tasks}</h1><p>{vi.tasks.filtered(filters.filtered.length)}</p></div>
<div className="tasks-head-actions">
<div className="task-view-tabs" role="tablist" aria-label={vi.tasks.viewChoice}>
<button role="tab" aria-label={vi.tasks.boardA11y} aria-selected={view === 'kanban'} onClick={() => changeView('kanban')}>{vi.tasks.board}</button>
<button role="tab" aria-selected={view === 'list'} onClick={() => changeView('list')}>{vi.tasks.list}</button>
<button role="tab" aria-selected={view === 'projects'} onClick={() => changeView('projects')}>{vi.tasks.projects}</button>
</div>
<Popover className="create-menu-trigger" panelClassName="create-menu-panel" align="end" accessibleLabel={vi.tasks.addTask}
  label={<><Plus size={16}/><span>{vi.tasks.addTask}</span></>}>
{[['project',vi.shell.projectChoice],['task',vi.shell.taskChoice],['combo',vi.shell.createCombo]].map(([value,label])=><button
  type="button" role="menuitem" {...blockedCreateProps} key={value} onClick={()=>openCreate(value)}>{label}</button>)}
</Popover>
</div>
</header>
    <span className="sr-only" data-render-complete="true">{vi.generated.TasksPage_95_1}{filters.filtered.length}{vi.generated.TasksPage_96_2}</span>
    <div className="tasks-filter-chips" aria-label={vi.tasks.filters}>
<Chip active={!filters.status.length} onClick={()=>filters.changeParam('status','')}>{vi.tasks.all}</Chip>
{STATUS_KEYS.map(key=><Chip
  key={key}
  active={filters.status.includes(key)}
  onClick={()=>filters.toggleParamValue('status',filters.status,key)}
>{vi.status[key]}</Chip>)}
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
    <div className="tasks-view-content" key={view}>{view==='kanban'&&<KanbanView
      data={data} filtered={filters.filtered} grouped={filters.grouped} hasFilters={filters.hasFilters}
      setParams={setParams} taskProps={actions.taskProps}
      dropTask={actions.dropTask} setDragging={actions.setDragging} setEditing={openEditor}
    />}
    {view==='list'&&<ListView
      data={data} filtered={filters.filtered} tagRegistry={tagRegistry} tagFilters={filters.tagFilters}
      toggleTag={actions.toggleTag} changeStatus={actions.changeStatus} setEditing={openEditor}
      setConfirm={setConfirm} setParams={setParams}
    />}
    <ProjectsView
      active={view==='projects'} editing={editing} data={data} loading={loading}
      projectStatus={actions.projectStatus} changeParam={filters.changeParam} setView={changeView}
      projectEditing={projectEditing} setProjectEditing={setProjectEditing}
      projectConfirm={projectConfirm} setProjectConfirm={setProjectConfirm}
      deleteTarget={deleteTarget} setDeleteTarget={setDeleteTarget}
      moveTarget={moveTarget} setMoveTarget={setMoveTarget} selectedProject={selectedProject}
      setEditing={setEditing} saveProject={actions.saveProject} archiveProject={actions.archiveProject}
      deleteProject={actions.deleteProject} moveProjectTasks={actions.moveProjectTasks}
      readOnly={readOnly} onReadOnly={onReadOnly} blockedCreateProps={blockedCreateProps}
    /></div>
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
