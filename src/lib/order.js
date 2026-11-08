export const between = (before,after) => before==null ? (after??1)-1 : after==null ? before+1 : (before+after)/2
export const needsRebalance = (a,b) => Math.abs(a-b)<1e-6
export const rebalance = items => [...items].sort((a,b)=>a.order-b.order).map((item,i)=>({...item,order:i+1}))

export function moveTaskOps(tasks,taskId,status,targetIndex,now=new Date().toISOString()){
 const moving=tasks.find(task=>task.id===taskId)
 if(!moving)return[]
 const target=tasks.filter(task=>task.id!==taskId&&task.status===status).sort((a,b)=>(a.order??0)-(b.order??0)),index=Math.max(0,Math.min(targetIndex??target.length,target.length)),before=target[index-1],after=target[index],order=between(before?.order,after?.order),statusPatch=status==='done'?{status,progress:100,completedAt:moving.completedAt||now}:{status,completedAt:null}
 if(before&&after&&needsRebalance(before.order,after.order)){
  const arranged=[...target];arranged.splice(index,0,{...moving,...statusPatch})
  return rebalance(arranged).map(task=>({type:'update',collection:'tasks',id:task.id,data:{order:task.order,...(task.id===taskId?statusPatch:{})}}))
 }
 return[{type:'update',collection:'tasks',id:taskId,data:{...statusPatch,order}}]
}
