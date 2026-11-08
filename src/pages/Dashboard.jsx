import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, CheckCircle2, Clock3, ListTodo, Plane, Plus } from 'lucide-react'
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'
import { Page, Header } from '@/app/App'
import { Button, Card, EmptyState, ProgressBar, StatusBadge } from '@/components/ui'
import { useActions, useDataState, useToast } from '@/hooks/useData'
import { getProjectEffectiveStatus } from '@/lib/projectStatus'
import { getDueState } from '@/lib/tasks'
import { projectProgress, withStatus } from '@/lib/progress'
import { compareTrips, findTripOverlaps, formatTripRange } from '@/lib/trips'
import { formatDate, todayISO, toISODate } from '@/lib/dates'
import { vi, STATUS_KEYS } from '@/i18n/vi'
import { useCountUp } from '@/hooks/useCountUp'
import { useTransitionNavigate } from '@/hooks/useTransitionNavigate'
import { completionSeries } from '@/lib/dashboard'
import { recurrenceCreateOp } from '@/lib/recurrence'
import { weeklyReport } from '@/lib/weeklyReport'
import { buildIndexes } from '@/lib/indexes'

const STATUS_COLORS = ['var(--status-todo)', 'var(--status-doing)', 'var(--status-waiting)', 'var(--status-done)', 'var(--status-paused)']
const donutBackground = items => {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  if (!total) return 'var(--color-surface)'
  let cursor = 0
  return `conic-gradient(${items.map(item => { const start = cursor; cursor += item.value / total * 100; return `${item.color} ${start}% ${cursor}%` }).join(',')})`
}

function CompletionChart({ values, labels }) {
  const max=Math.max(1,...values)
  const points=values.map((value,index)=>`${18+index*(384/(values.length-1))},${130-value/max*100}`).join(' ')
  return <svg className="completion-chart" viewBox="0 0 420 165" role="img" aria-label={vi.generated.Dashboard_31_0(values.join(', '))}>
    <path className="chart-guide" d="M18 130H402"/>
    <polyline className="completion-line completion-glow" points={points}/>
    <polyline className="completion-line" points={points}/>
    {values.map((value,index)=><circle className={index===values.length-1?'chart-end':''} key={labels[index]} cx={18+index*(384/(values.length-1))} cy={130-value/max*100} r={index===values.length-1?5:3}/>) }
    <text x="18" y="157">{labels[0]}</text><text x="210" y="157" textAnchor="middle">{labels[3]}</text><text x="402" y="157" textAnchor="end">{labels[6]}</text>
  </svg>
}

function AnimatedNumber({value}){const ref=useCountUp(value);return <span className="animated-number"><span className="sr-only">{value}</span><span ref={ref} aria-hidden="true">{value}</span></span>}

function Dashboard() {
  const { data, loading } = useDataState()
  const { batch } = useActions()
  const toast = useToast()
  const navigate = useTransitionNavigate()
  const [period, setPeriod] = useState(()=>{try{const value=localStorage.getItem('nhip-viec-period');return ['today','week','month'].includes(value)?value:'week'}catch{return 'week'}})
  const[showReport,setShowReport]=useState(false)
  const recoveryShown=useRef(false)
  useEffect(()=>{try{localStorage.setItem('nhip-viec-period',period)}catch{/* Storage can be unavailable. */}},[period])
  useEffect(()=>{if(data.recoveryError&&!recoveryShown.current){recoveryShown.current=true;toast(vi.generated.Dashboard_51_1)}if(!data.recoveryError)recoveryShown.current=false},[data.recoveryError,toast])
  const today = todayISO()
  const indexes=useMemo(()=>buildIndexes(data),[data.projects,data.tasks,data.contacts,data.trips,data.notes])
  const projectRows=useMemo(()=>{
    const rows=data.projects.map((project,index)=>{
      const tasks=indexes.tasksByProject.get(project.id)||[]
      return {project,index,tasks,status:getProjectEffectiveStatus(project,tasks,{loading}),progress:projectProgress(tasks,project.id)}
    }).filter(item=>item.status!=='archived')
    return [...rows.filter(item=>item.status!=='done'),...rows.filter(item=>item.status==='done')]
  },[data.projects,indexes,loading])
  const range = useMemo(() => period === 'today'
    ? [today, today]
    : period === 'month'
      ? [toISODate(startOfMonth(new Date())), toISODate(endOfMonth(new Date()))]
      : [toISODate(startOfWeek(new Date(), { weekStartsOn: 1 })), toISODate(endOfWeek(new Date(), { weekStartsOn: 1 }))], [period, today])
  const summary = useMemo(() => {
    const scoped = data.tasks.filter(task => task.dueDate >= range[0] && task.dueDate <= range[1])
    const byStatus = Object.fromEntries(STATUS_KEYS.map(status => [status, data.tasks.filter(task => task.status === status)]))
    const chartDates=Array.from({length:7},(_,index)=>toISODate(addDays(new Date(),index-6)))
    const chartValues=completionSeries(data.tasks,chartDates)
    const completed=scoped.filter(task=>task.status==='done').length
    const completionRate=scoped.length?Math.round(completed/scoped.length*100):0
    const dueSoon=data.tasks.filter(task => getDueState(task) === 'soon').length
    const overdue=data.tasks.filter(task => getDueState(task) === 'overdue').length
    return {
      scoped, completed, completionRate, dueSoon, overdue, chartValues,
      chartLabels:chartDates.map(date=>formatDate(date).slice(0,5)),
      pie: STATUS_KEYS.map((status, index) => ({ name: vi.status[status], value: byStatus[status].length, color: STATUS_COLORS[index] })),
      bars: projectRows.map(item => ({ name: item.project.name, value: item.tasks.length })),
      upcoming: data.trips.filter(trip => !trip.completed && trip.endDate >= today).sort(compareTrips).slice(0, 3),
      overlapIds: new Set(findTripOverlaps(data.trips).flat().map(trip => trip.id)),
      todayTasks: indexes.tasksByDue.get(today) || [],
      weekTasks: data.tasks.filter(task => task.dueDate > today && task.dueDate <= toISODate(addDays(new Date(), 7))),
    }
  }, [data, indexes, projectRows, range, today])
  const dayChips=useMemo(()=>Array.from({length:7},(_,index)=>{const date=toISODate(addDays(new Date(),index-2));return{date,label:['CN','T2','T3','T4','T5','T6','T7'][addDays(new Date(),index-2).getDay()]}}),[])
  const goToScope=query=>navigate(`/cong-viec${query?`?${query}`:''}`)
  const noData=!data.projects.length&&!data.tasks.length&&!data.contacts.length&&!data.trips.length
  const report=useMemo(()=>weeklyReport(data,today),[data,today])
  const toggleTask=task=>{const status=task.status==='done'?'todo':'done',created=status==='done'?recurrenceCreateOp(task,data.tasks):null;return batch([{type:'update',collection:'tasks',id:task.id,data:withStatus(task,status)},...(created?[created]:[])])}
  const copyReport=async()=>{await navigator.clipboard.writeText(report);toast(vi.generated.Dashboard_91_2)}

  return <Page>
    <Header title={vi.generated.Dashboard_94_3} description={vi.generated.Dashboard_94_4(formatDate(today))} action={<Button variant="secondary" onClick={()=>setShowReport(value=>!value)}>{vi.generated.Dashboard_94_5}</Button>}/>
    {showReport&&<Card><div className="section-row"><h2>{vi.generated.Dashboard_95_6}</h2><Button onClick={copyReport}>{vi.generated.Dashboard_95_7}</Button></div><pre className="weekly-report">{report}</pre></Card>}
    {noData?<Card><EmptyState title={vi.generated.Dashboard_96_8} description={vi.generated.Dashboard_96_9} action={<Button icon={Plus} onClick={()=>navigate('/?new=1')}>{vi.generated.Dashboard_96_10}</Button>}/></Card>:<div className="dashboard-refresh">
      <section className="dashboard-hero-grid">
        <Card className="today-pulse-card">
          <div className="section-row dashboard-card-head"><div><span className="eyebrow">{vi.generated.Dashboard_99_11}</span><h2>{vi.generated.Dashboard_99_12}</h2><p className="muted">{vi.generated.Dashboard_99_13}</p></div><div className="dashboard-head-actions"><label className="sr-only" htmlFor="dashboard-period">{vi.generated.Dashboard_99_14}</label><select className="pill hard-shadow" id="dashboard-period" value={period} onChange={event=>setPeriod(event.target.value)}><option value="today">{vi.generated.Dashboard_99_15}</option><option value="week">{vi.generated.Dashboard_99_16}</option><option value="month">{vi.generated.Dashboard_99_17}</option></select><Button variant="secondary" onClick={()=>goToScope(`from=${range[0]}&to=${range[1]}`)}>{vi.generated.Dashboard_99_18}</Button></div></div>
          <div className="status-legend" aria-label={vi.generated.Dashboard_100_19}><span><i className="shape-half"/>{vi.generated.Dashboard_100_20}</span><span><i className="shape-check"><Check size={10}/></i>{vi.generated.Dashboard_100_21}</span><span><i className="shape-alert"><AlertTriangle size={11}/></i>{vi.generated.Dashboard_100_22}</span></div>
          <div className="hero-kpis">
            <button className="hero-kpi tile tile-lime" onClick={()=>goToScope('status=doing')}><ArrowUpRight aria-hidden="true"/><span>{vi.generated.Dashboard_102_23}</span><strong><AnimatedNumber value={summary.scoped.filter(task=>task.status==='doing').length}/></strong><small>{vi.generated.Dashboard_102_24}</small></button>
            <button className="hero-kpi tile tile-lavender" onClick={()=>goToScope('status=done')}><CheckCircle2 aria-hidden="true"/><span>{vi.generated.Dashboard_103_25}</span><strong><AnimatedNumber value={summary.completed}/></strong><small>{summary.completionRate}{vi.generated.Dashboard_103_26}</small></button>
            <button className="hero-kpi tile tile-ink" onClick={()=>goToScope('due=overdue')}><AlertTriangle aria-hidden="true"/><span>{vi.generated.Dashboard_104_27}</span><strong><AnimatedNumber value={summary.overdue}/></strong><small>{vi.generated.Dashboard_104_28}</small></button>
          </div>
          <div className="minor-kpis"><button onClick={()=>goToScope(`from=${range[0]}&to=${range[1]}`)}><ListTodo/><span>{vi.generated.Dashboard_106_29}</span><strong>{summary.scoped.length}</strong></button><button onClick={()=>goToScope('due=soon')}><Clock3/><span>{vi.generated.Dashboard_106_30}</span><strong>{summary.dueSoon}</strong></button></div>
          <div className="date-chips" aria-label={vi.generated.Dashboard_107_31}>{dayChips.map(item=><button className={item.date===today?'active':''} aria-pressed={item.date===today} key={item.date} onClick={()=>goToScope(`from=${item.date}&to=${item.date}`)}><span>{item.label}</span><strong>{item.date.slice(-2)}</strong></button>)}</div>
        </Card>
        <Card className="completion-card tile-ink">
          <div className="section-row"><div><span className="eyebrow">{vi.generated.Dashboard_110_32}</span><h2>{vi.generated.Dashboard_110_33}</h2></div><span className="trend-pill"><ArrowUpRight size={14}/> {summary.completionRate}%</span></div>
          <div className="completion-number"><strong><AnimatedNumber value={summary.completed}/></strong><span>{vi.generated.Dashboard_111_34}<br/>{vi.generated.Dashboard_111_35}</span></div>
          <CompletionChart values={summary.chartValues} labels={summary.chartLabels}/>
          <div className="completion-minis"><div><span className="mini-columns"><i style={{'--bar':`${Math.max(18,summary.scoped.length*8)}%`}}/><i style={{'--bar':`${Math.max(14,summary.completed*14)}%`}}/></span><strong>{summary.scoped.length}</strong><small>{vi.generated.Dashboard_113_36}</small></div><div><span className="mini-columns lavender"><i style={{'--bar':`${Math.max(18,summary.completed*15)}%`}}/><i style={{'--bar':`${Math.max(12,summary.completionRate)}%`}}/></span><strong>{summary.completed}</strong><small>{vi.generated.Dashboard_113_37}</small></div></div>
        </Card>
      </section>

      <section className="dashboard-lower-grid">
        <Card className="project-overview-card"><div className="section-row"><div><span className="eyebrow">{vi.generated.Dashboard_118_38}</span><h2>{vi.generated.Dashboard_118_39}</h2></div><Button variant="ghost" onClick={()=>goToScope('view=projects')}>{vi.generated.Dashboard_118_40}</Button></div><div className="project-progress-list">{projectRows.map(({project,index,status,progress,tasks})=><button className={`project-progress-row label-theme-${index%8+1} ${status==='done'?'is-done':''}`} key={project.id} onClick={()=>goToScope(`projectId=${project.id}`)}><span className="project-progress-info"><i/><span className="project-progress-name">{project.name}{status==='waiting'&&<StatusBadge value="waiting"/>}{status==='done'&&<span className="project-done-label"><Check size={14} aria-hidden="true"/>{vi.dashboard.completedProject}</span>}</span><small>{tasks.length}{vi.generated.Dashboard_118_41}</small></span><ProgressBar value={progress}/></button>)}</div><div className="project-charts"><div><h3>{vi.generated.Dashboard_118_42}</h3><div className="chart chart-centered"><div className="donut-chart" role="img" aria-label={summary.pie.map(item=>`${item.name}: ${item.value}`).join(', ')} style={{background:donutBackground(summary.pie)}}><span>{data.tasks.length}</span></div></div><div className="legend">{summary.pie.map(item=><span key={item.name}><i style={{background:item.color}}/>{item.name} {item.value}</span>)}</div></div><div><h3>{vi.generated.Dashboard_118_43}</h3><div className="chart mini-bars" role="img" aria-label={summary.bars.length?summary.bars.map(item=>vi.generated.Dashboard_118_44(item.name,item.value)).join(', '):vi.generated.Dashboard_118_45}>{summary.bars.map((item,index)=><div className="mini-bar-item" key={item.name}><span className={`mini-bar label-theme-${index%8+1}`} style={{width:`${Math.max(8,item.value/Math.max(1,...summary.bars.map(bar=>bar.value))*100)}%`}}/><small title={item.name}>{item.name}</small><strong>{item.value}</strong></div>)}</div></div></div></Card>
        <Card className="attention-card">
          <div><span className="eyebrow">{vi.dashboard.priority}</span><h2>{vi.dashboard.attention}</h2></div>
          <div className="focus-columns">
            {[[vi.dashboard.todayTasks,summary.todayTasks],[vi.dashboard.nextWeekTasks,summary.weekTasks]].map(([label,tasks])=><section className="attention-column" key={label}>
              <h3>{label} <span>{tasks.length}</span></h3>
              {tasks.length?tasks.slice(0,5).map(task=>{
                const due=getDueState(task),project=indexes.byId.projects.get(task.projectId)
                return <div className={`attention-task ${task.status==='done'?'is-done':''}`} key={task.id}>
                  <button type="button" className="completion-toggle attention-complete" aria-pressed={task.status==='done'} aria-label={vi.dashboard.completeLabel(task.title)} title={vi.dashboard.completeLabel(task.title)} draggable={false} onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation();toggleTask(task)}}>
                    <span className="completion-toggle__icon" aria-hidden="true">{task.status==='done'&&<Check strokeWidth={3}/>}</span>
                  </button>
                  <div className="attention-task-content">
                    <span className="attention-task-title" title={task.title}>{task.title}</span>
                    <small className="attention-task-meta"><span className={`attention-due due-${due}`}>{due==='today'?<><Clock3 size={13} aria-hidden="true"/>{vi.dashboard.dueToday} · </>:due==='overdue'?<><AlertTriangle size={13} aria-hidden="true"/>{vi.dashboard.overdue} · </>:null}{formatDate(task.dueDate)}</span>{project&&<span> · {project.name}</span>}</small>
                  </div>
                  <div className="attention-task-status"><StatusBadge value={task.status}/></div>
                </div>
              }):<p className="attention-empty">{vi.dashboard.emptyTasks}</p>}
            </section>)}
          </div>
          <div className="attention-trips"><h3>{vi.generated.Dashboard_139_46}</h3><div className="upcoming-trips">{summary.upcoming.map(trip=><button className="data-row" key={trip.id} onClick={()=>navigate('/cong-tac')}><span className="trip-icon"><Plane size={17}/></span><span><strong>{trip.location}</strong><small>{formatTripRange(trip)}</small></span>{summary.overlapIds.has(trip.id)&&<AlertTriangle className="text-warning" size={17}/>}</button>)}</div>{summary.upcoming.some(trip=>summary.overlapIds.has(trip.id))&&<div className="overlap-note"><AlertTriangle size={18}/><span><strong>{vi.generated.Dashboard_139_47}</strong><small>{vi.generated.Dashboard_139_48}</small></span><ArrowDownRight size={18}/></div>}</div></Card>
      </section>
    </div>}
  </Page>
}

export default memo(Dashboard)
