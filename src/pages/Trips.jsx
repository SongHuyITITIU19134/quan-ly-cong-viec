import { useEffect, useId, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, MapPin, Plus, Trash2 } from 'lucide-react'
import CompleteToggle from '@/components/ui/CompleteToggle'
import { Page, Header } from '@/app/App'
import { Button, Card, Drawer, EmptyState, Modal, ProgressBar, StatusBadge } from '@/components/ui'
import { useActions, useDataState, useToast } from '@/hooks/useData'
import { compareTrips, findTripOverlaps, formatTripRange, getTripPhase, normalizeTrip, tasksDueDuringTrip } from '@/lib/trips'
import { buildDeleteOps, buildRestoreOps } from '@/lib/relations'
import { todayISO } from '@/lib/dates'
import { taskProgress, withStatus } from '@/lib/progress'
import { vi } from '@/i18n/vi'
import { TRIP_LOCATION_MAX, TRIP_NAME_MAX, TRIP_NOTES_MAX, TRIP_PURPOSE_MAX } from '@/lib/limits'
import { useTransitionNavigate } from '@/hooks/useTransitionNavigate'
import { recurrenceCreateOp } from '@/lib/recurrence'

const blank = normalizeTrip({ name: '', location: '', startDate: todayISO(), endDate: todayISO(), purpose: '', contactIds: [], notes: '', color: '#0f766e' })
const groupOrder=(a,b)=>Number(Boolean(a.completed))-Number(Boolean(b.completed))||compareTrips(a,b)
function TripRange({trip}){return <><span className="trip-range-full">{formatTripRange(trip)}</span><span className="trip-range-short">{formatTripRange(trip,{short:true})}</span></>}

export function TripForm({ trip, contacts=[], projects=[], onSave, onCancel, formId, showActions=true }) {
  const prefix = useId()
  const [saving, setSaving] = useState(false)
  const [dateError, setDateError] = useState('')
  const id = name => `${prefix}-${name}`
  const submit = async event => {
    event.preventDefault()
    const form = event.currentTarget
    const formData=new FormData(form),value=Object.fromEntries(formData)
    value.contactIds=formData.getAll('contactIds')
    value.projectId=value.projectId||null
    if (value.endDate < value.startDate) {
      setDateError(vi.trips.dateError)
      form.elements.endDate.focus()
      return
    }
    if(value.startDate===value.endDate&&value.startSession==='chieu'&&value.endSession==='sang'){
      setDateError(vi.trips.sessionError)
      form.querySelector('[name="endSession"]').focus()
      return
    }
    setDateError('')
    setSaving(true)
    const saved = await onSave(value)
    if (!saved) setSaving(false)
  }
  return <form id={formId} onSubmit={submit}>
    <div className="form-grid">
      <div className="field span-2"><label htmlFor={id('name')}>Tên chuyến *</label><input id={id('name')} data-autofocus name="name" required maxLength={TRIP_NAME_MAX} defaultValue={trip.name}/></div>
      <div className="field span-2"><label htmlFor={id('location')}>Địa điểm *</label><input id={id('location')} name="location" required maxLength={TRIP_LOCATION_MAX} defaultValue={trip.location}/></div>
      {['start','end'].map(boundary=>{
        const dateName=`${boundary}Date`,sessionName=`${boundary}Session`
        return <div className="field" key={boundary}><label htmlFor={id(dateName)}>{vi.trips[dateName]}</label><input id={id(dateName)} type="date" name={dateName} required defaultValue={trip[dateName]} aria-describedby={dateError?id('dateError'):undefined} aria-invalid={Boolean(dateError)}/><fieldset className="trip-session-control" aria-describedby={dateError?id('dateError'):undefined}><legend>{vi.trips[sessionName]}</legend>{Object.entries(vi.trips.sessions).map(([value,label])=><label key={value} htmlFor={id(`${sessionName}-${value}`)}><input id={id(`${sessionName}-${value}`)} type="radio" name={sessionName} value={value} defaultChecked={normalizeTrip(trip)[sessionName]===value} aria-invalid={Boolean(dateError)} aria-describedby={dateError?id('dateError'):undefined}/>{label}</label>)}</fieldset></div>
      })}
      {dateError && <p className="field-error span-2" id={id('dateError')} role="alert">{dateError}</p>}
      <div className="field span-2"><label htmlFor={id('purpose')}>Mục đích</label><textarea id={id('purpose')} name="purpose" maxLength={TRIP_PURPOSE_MAX} defaultValue={trip.purpose}/></div>
      <div className="field span-2"><label htmlFor={id('notes')}>Ghi chú</label><textarea id={id('notes')} name="notes" maxLength={TRIP_NOTES_MAX} defaultValue={trip.notes}/></div>
      <div className="field"><label htmlFor={id('project')}>Dự án</label><select id={id('project')} name="projectId" defaultValue={trip.projectId||''}><option value="">Không thuộc dự án</option>{projects.filter(project=>!project.archived).map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
      <div className="field"><label htmlFor={id('contacts')}>Liên hệ tham gia</label><select id={id('contacts')} name="contactIds" multiple defaultValue={trip.contactIds||[]}>{contacts.filter(contact=>contact.id!=='self').map(contact=><option key={contact.id} value={contact.id}>{contact.fullName}</option>)}</select></div>
      <div className="field"><label htmlFor={id('color')}>Màu chuyến đi</label><input id={id('color')} name="color" type="color" defaultValue={trip.color}/></div>
    </div>
    {showActions&&<div className="inline-actions"><Button variant="secondary" onClick={onCancel} disabled={saving}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu chuyến đi'}</Button></div>}
  </form>
}

export default function Trips() {
  const { data } = useDataState()
  const { create, update, batch } = useActions()
  const toast = useToast()
  const navigate=useTransitionNavigate()
  const [editing, setEditing] = useState(null)
  const [selectedTrip, setSelected] = useState(null)
  const selected=data.trips.find(trip=>trip.id===selectedTrip?.id)||selectedTrip
  const [pending,setPending]=useState([])
  const [confirm, setConfirm] = useState(null)
  const [params,setParams] = useSearchParams()
  const tripFormId='trip-editor-form'
  const overlaps = useMemo(() => findTripOverlaps(data.trips), [data.trips])
  const groups = useMemo(() => ({
    ongoing: data.trips.filter(t => t.startDate <= todayISO() && t.endDate >= todayISO()).sort(groupOrder),
    upcoming: data.trips.filter(t => t.startDate > todayISO()).sort(groupOrder),
    past: data.trips.filter(t => t.endDate < todayISO()).sort(groupOrder),
  }), [data.trips])
  useEffect(()=>{const trip=data.trips.find(item=>item.id===params.get('edit'));if(params.get('new')==='trip'||trip){setEditing(trip||blank);const next=new URLSearchParams(params);next.delete('new');next.delete('edit');setParams(next,{replace:true})}},[data.trips,params,setParams])
  useEffect(()=>{const trip=data.trips.find(item=>item.id===params.get('trip'));if(trip){setSelected(trip);const next=new URLSearchParams(params);next.delete('trip');setParams(next,{replace:true})}},[data.trips,params,setParams])
  const tripTasks = trip => data.tasks.filter(task => task.tripId === trip.id)
  const completeTask=(task,status)=>{const created=status==='done'?recurrenceCreateOp(task,data.tasks):null;return batch([{type:'update',collection:'tasks',id:task.id,data:withStatus(task,status)},...(created?[created]:[])])}
  const toggleCompleted=async trip=>{
    setPending(ids=>[...ids,trip.id])
    const old={completed:Boolean(trip.completed),completedAt:trip.completedAt??null}
    const result=await update('trips',trip.id,{completed:!old.completed,completedAt:old.completed?null:new Date().toISOString()})
    setPending(ids=>ids.filter(id=>id!==trip.id))
    if(!result)return
    toast(old.completed?vi.trips.reopened:vi.trips.markedComplete,{label:vi.action.undo,onClick:()=>update('trips',trip.id,old)})
  }
  const completionTick=(trip,showLabel=false)=><CompleteToggle checked={Boolean(trip.completed)} onChange={()=>toggleCompleted(trip)} label={trip.name} disabled={pending.includes(trip.id)} showLabel={showLabel}/>
  const save = async value => {
    const result = editing.id
      ? await update('trips', editing.id, value)
      : await create('trips', { ...blank, ...value })
    if (!result) return false
    toast('Đã lưu chuyến công tác.')
    setEditing(null)
    return true
  }
  const deleteTrip = async () => {
    const ops=buildDeleteOps('trip',confirm.id,data),undo=buildRestoreOps(ops,data)
    if(!await batch(ops))return
    setConfirm(null)
    setSelected(null)
    toast('Đã xóa chuyến đi và gỡ liên kết nhiệm vụ.',{label:vi.action.undo,onClick:()=>batch(undo)})
  }

  return <Page>
    <Header title={vi.nav.trips} description="Chuẩn bị, theo dõi và tổng kết từng chuyến đi" action={<Button icon={Plus} onClick={() => setEditing(blank)}>Tạo chuyến</Button>}/>
    {overlaps.length > 0 && <div className="warning-banner" role="status"><AlertTriangle size={19}/><div><strong>Có {overlaps.length} lịch công tác trùng nhau</strong><p>{overlaps.map(([a, b]) => `${a.name} ↔ ${b.name}`).join(' · ')}</p></div></div>}
    {!data.trips.length?<Card><EmptyState title="Chưa có chuyến công tác" description="Tạo chuyến đầu tiên để chuẩn bị lịch trình." action={<Button icon={Plus} onClick={()=>setEditing(blank)}>Tạo chuyến công tác</Button>}/></Card>:Object.entries(groups).map(([key, list]) => <section className="trip-section" key={key}>
      <h2>{{ ongoing: 'Đang diễn ra', upcoming: 'Sắp tới', past: 'Đã qua' }[key]} <span>{list.length}</span></h2>
      <div className="trip-grid">
        {list.map((trip,index) => {
          const tasks = tripTasks(trip)
          const prep = tasks.filter(task => getTripPhase(task, trip) === 'before')
          const prepProgress=prep.length ? Math.round(prep.reduce((sum, task) => sum + taskProgress(task), 0) / prep.length) : 0
          return <Card key={trip.id} className={`trip-card trip-tile label-theme-${index%8+1} ${trip.completed?'is-complete':''}`}>
            <div className="trip-content">
              <span className="trip-date"><TripRange trip={trip}/></span>
              <div className="trip-title-row">{completionTick(trip)}<h3><button className="trip-title" onClick={()=>setSelected(trip)}>{trip.name}</button></h3></div>
              {trip.completed&&<span className="trip-completed-badge"><CheckCircle2 size={16}/>{vi.trips.completed}</span>}
              <button className="trip-open" aria-label={trip.name} onClick={()=>setSelected(trip)}><p><MapPin size={15}/> {trip.location}</p><p className="muted">{trip.purpose}</p>
              <div className="trip-stats"><span><strong>{tasks.length}</strong><small>Số việc</small></span><span><strong>{prepProgress}%</strong><small>Chuẩn bị</small></span></div>
              <ProgressBar value={prepProgress}/>
              </button>
            </div>
          </Card>
        })}
        {!list.length && <Card><EmptyState title="Không có chuyến trong nhóm này"/></Card>}
      </div>
    </section>)}
    {editing && <Drawer title={editing.id ? 'Sửa chuyến công tác' : 'Tạo chuyến công tác'} onClose={() => setEditing(null)} actions={<><Button variant="secondary" onClick={()=>setEditing(null)}>Hủy</Button><Button type="submit" form={tripFormId}>Lưu chuyến đi</Button></>}><TripForm formId={tripFormId} showActions={false} trip={editing} contacts={data.contacts} projects={data.projects} onSave={save} onCancel={() => setEditing(null)}/></Drawer>}
    {selected && <Modal title={selected.name} onClose={() => setSelected(null)}>
      <div className="trip-title-row">{completionTick(selected,true)}</div>
      <p><MapPin size={16}/> {selected.location} · {formatTripRange(selected)}</p><p>{selected.purpose}</p>
      <p>Dự án: {data.projects.find(project=>project.id===selected.projectId)?.name||'Không liên kết'}</p><p>Liên hệ: {(selected.contactIds||[]).map(id=>data.contacts.find(contact=>contact.id===id)?.fullName).filter(Boolean).join(', ')||'Không có'}</p>
      <section className="related-block"><h3>Ghi chú liên quan</h3>{data.notes.filter(note=>note.links?.tripId===selected.id).map(note=><p key={note.id}>{note.title}</p>)}<Button variant="secondary" onClick={()=>navigate(`/so-tay?new=note&tripId=${selected.id}`)}>Tạo ghi chú liên kết</Button></section>
      <div className="phase-timeline">{['before', 'during', 'after'].map(phase => <section className="phase-block" key={phase}><h3>{{ before: 'Trước chuyến đi', during: 'Trong chuyến đi', after: 'Sau chuyến đi' }[phase]}</h3>{tripTasks(selected).filter(task => getTripPhase(task, selected) === phase).map(task => <div className={`related-row ${task.status==='done'?'is-complete':''}`} key={task.id}><CompleteToggle checked={task.status==='done'} onChange={checked=>completeTask(task,checked?'done':'todo')} label={task.title} showLabel/><span className="related-task-title">{task.title}</span><StatusBadge value={task.status}/></div>)}</section>)}</div>
      <section className="phase-block highlight"><h3>Việc đến hạn trong thời gian đi</h3>{tasksDueDuringTrip(data.tasks, selected).map(task => <div className="related-row" key={task.id}><span>{task.title}{!task.tripId && <small> · Chưa gắn chuyến</small>}</span><StatusBadge value={task.status}/></div>)}</section>
      <div className="inline-actions"><Button variant="secondary" onClick={() => setEditing(selected)}>Chỉnh sửa</Button><Button variant="danger" icon={Trash2} onClick={() => setConfirm(selected)}>Xóa</Button></div>
    </Modal>}
    {confirm && <Modal title="Xóa chuyến công tác?" onClose={() => setConfirm(null)} actions={<><Button variant="secondary" onClick={() => setConfirm(null)}>Hủy</Button><Button variant="danger" onClick={deleteTrip}>Xóa và gỡ liên kết</Button></>}><p>{tripTasks(confirm).length} nhiệm vụ sẽ được giữ lại nhưng không còn gắn với chuyến đi này.</p></Modal>}
  </Page>
}
