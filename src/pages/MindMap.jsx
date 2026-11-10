import { useEffect, useMemo, useRef, useState } from 'react'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import { Page, Header } from '@/app/App'
import { Button, Drawer, EmptyState } from '@/components/ui'
import MindMapView from '@/components/mindmap/MindMapView'
import TreeMapView from '@/components/mindmap/TreeMapView'
import TaskForm from '@/components/task/TaskForm'
import { buildMindMap } from '@/components/mindmap/buildMindMap'
import { useData } from '@/hooks/useData'
import { useTransitionNavigate } from '@/hooks/useTransitionNavigate'
import { STATUS_KEYS, vi } from '@/i18n/vi'

const isMobile=()=>typeof matchMedia==='function'&&matchMedia('(max-width:600px)').matches

export default function MindMap(){
  const{data,update,toast}=useData(),navigate=useTransitionNavigate()
  const[view,setView]=useState(()=>isMobile()?'list':'mind'),[projectId,setProjectId]=useState(''),[statuses,setStatuses]=useState(STATUS_KEYS)
  const[expandedId,setExpandedId]=useState(''),[selectedTreeId,setSelectedTreeId]=useState(''),[editing,setEditing]=useState(null)
  const[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),drag=useRef(null)
  const tree=useMemo(()=>buildMindMap(data,{projectId,statuses}),[data,projectId,statuses])
  useEffect(()=>{if(!tree.projects.some(project=>project.id===expandedId))setExpandedId(tree.projects[0]?.id||'')},[tree,expandedId])
  const toggleStatus=status=>setStatuses(current=>current.includes(status)?current.filter(item=>item!==status):[...current,status])
  const fit=()=>{setZoom(1);setPan({x:0,y:0})}
  const pointerDown=event=>{if(event.target.closest('button'))return;drag.current={x:event.clientX-pan.x,y:event.clientY-pan.y};event.currentTarget.setPointerCapture(event.pointerId)}
  const pointerMove=event=>{if(drag.current)setPan({x:event.clientX-drag.current.x,y:event.clientY-drag.current.y})}
  const pointerUp=()=>{drag.current=null}
  const saveTask=async form=>{if(!await update('tasks',editing.id,form))return;toast(vi.generated.MindMap_27_0);setEditing(null)}
  return <Page><div className="mind-page"><Header title={vi.nav.mindMap} description={vi.generated.MindMap_28_1}/>
    <div className="mind-toolbar"><select aria-label={vi.generated.MindMap_29_2} value={projectId} onChange={event=>setProjectId(event.target.value)}><option value="">{vi.generated.MindMap_29_3}</option>{data.projects.filter(project=>!project.archived).map(project=><option value={project.id} key={project.id}>{project.name}</option>)}</select><div className="status-chips" aria-label={vi.generated.MindMap_29_4}>{STATUS_KEYS.map(status=><button type="button" className={`status-${status} ${statuses.includes(status)?'active':''}`} aria-pressed={statuses.includes(status)} key={status} onClick={()=>toggleStatus(status)}>{vi.status[status]}</button>)}</div><div className="segmented mind-view-toggle" role="group" aria-label={vi.generated.MindMap_29_5}><button className={view==='mind'?'active':''} onClick={()=>setView('mind')}>{vi.generated.MindMap_29_6}</button><button className={view==='tree'?'active':''} onClick={()=>setView('tree')}>{vi.mindMap.treeMap}</button><button className={view==='list'?'active':''} onClick={()=>setView('list')}>{vi.generated.MindMap_29_7}</button></div></div>
    {!tree.projects.length?<EmptyState title={vi.generated.MindMap_30_8} description={vi.generated.MindMap_30_9} action={<Button onClick={()=>navigate('/so-do?new=1')}>{vi.generated.MindMap_30_10}</Button>}/>:<div className="mind-workspace">{view==='tree'?<TreeMapView tree={tree} selectedId={selectedTreeId} onSelect={setSelectedTreeId} onTask={setEditing}/>:<><div className="mind-zoom"><Button variant="secondary" onClick={()=>setZoom(value=>Math.max(.5,value-.1))} aria-label={vi.generated.MindMap_30_11}><Minus/></Button><Button variant="secondary" onClick={()=>setZoom(value=>Math.min(1.8,value+.1))} aria-label={vi.generated.MindMap_30_12}><Plus/></Button><Button variant="secondary" onClick={fit} aria-label={vi.generated.MindMap_30_13}><LocateFixed/></Button></div><MindMapView tree={tree} expandedId={expandedId} onExpand={setExpandedId} onTask={setEditing} onTrip={trip=>navigate(`/cong-tac?edit=${trip.id}`)} transform={view==='list'?'none':`translate(${pan.x}px,${pan.y}px) scale(${zoom})`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} mobile={view==='list'}/></>}</div>}
    </div>{editing&&<Drawer title={vi.generated.MindMap_31_14} onClose={()=>setEditing(null)} actions={<><Button variant="secondary" onClick={()=>setEditing(null)}>{vi.generated.MindMap_31_15}</Button><Button type="submit" form="mind-task-form">{vi.generated.MindMap_31_16}</Button></>}><TaskForm formId="mind-task-form" showActions={false} task={editing} projects={data.projects} contacts={data.contacts} trips={data.trips} onSave={saveTask} onCancel={()=>setEditing(null)}/></Drawer>}
  </Page>
}
