import { STATUS_KEYS, vi } from '@/i18n/vi'
import { projectProgress } from '@/lib/progress'

const limited=items=>({items:items.slice(0,12),more:Math.max(0,items.length-12)})

export function buildMindMap(data,{projectId='',statuses=STATUS_KEYS}={}){
  const projects=(data.projects||[]).filter(project=>!project.archived&&(!projectId||project.id===projectId)).map(project=>{
    const tasks=(data.tasks||[]).filter(task=>task.projectId===project.id&&statuses.includes(task.status))
    const statusGroups=STATUS_KEYS.map(status=>{const allItems=tasks.filter(task=>task.status===status);return{status,label:vi.status[status],count:allItems.length,allItems,...limited(allItems)}}).filter(group=>group.count)
    const linkedTripIds=new Set((data.tasks||[]).filter(task=>task.projectId===project.id&&task.tripId).map(task=>task.tripId))
    const trips=(data.trips||[]).filter(trip=>trip.projectId===project.id||linkedTripIds.has(trip.id))
    return{...project,taskCount:tasks.length,totalTaskCount:(data.tasks||[]).filter(task=>task.projectId===project.id).length,progress:projectProgress(data.tasks||[],project.id),statusGroups,trips:limited(trips)}
  })
  const linkedTripIds=new Set((data.tasks||[]).filter(task=>task.projectId&&task.tripId).map(task=>task.tripId))
  const unlinked=(data.trips||[]).filter(trip=>!trip.projectId&&!linkedTripIds.has(trip.id))
  if(unlinked.length&&!projectId)projects.push({id:'__unlinked__',name:vi.generated.buildMindMap_16_0,taskCount:0,totalTaskCount:0,progress:0,statusGroups:[],trips:limited(unlinked),unlinked:true})
  return{name:vi.generated.buildMindMap_17_1,projects}
}
