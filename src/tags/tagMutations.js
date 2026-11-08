import { normalizeTag, normalizeTags, tagKey } from './tagUtils'

const itemNames=(items,key)=>{for(const item of items)for(const name of normalizeTags(item.tags))if(tagKey(name)===key)return name;return''}
const cleanRegistry=(items,colors)=>{const used=new Set(items.flatMap(item=>normalizeTags(item.tags).map(tagKey)));return{c:Object.fromEntries(Object.entries(colors||{}).filter(([key])=>used.has(key)))}}

export function buildTagMutation(items=[],registry={c:{}},mutation){
  const source=tagKey(mutation.key),type=mutation.type,current=items.map(item=>({...item,tags:normalizeTags(item.tags)})),sourceName=itemNames(current,source)
  if(type==='recolor'){
    const color=Math.max(0,Math.min(11,Number(mutation.color)||0)),next=cleanRegistry(current,registry.c)
    if(sourceName)next.c[source]=color
    return{updates:[],registry:next,count:0,name:sourceName}
  }
  const requested=type==='rename'?normalizeTag(mutation.name):'',target=tagKey(requested),existing=target&&target!==source?itemNames(current,target):'',replacement=existing||requested
  const updates=[]
  for(const item of current){
    if(!item.tags.some(name=>tagKey(name)===source))continue
    const tags=type==='delete'?item.tags.filter(name=>tagKey(name)!==source):normalizeTags(item.tags.map(name=>tagKey(name)===source?replacement:name))
    updates.push({id:item.id,collection:item.collection||'tasks',tags})
  }
  const byId=new Map(updates.map(update=>[update.id,update.tags])),projected=current.map(task=>byId.has(task.id)?{...task,tags:byId.get(task.id)}:task),colors={...registry.c},sourceColor=colors[source]
  delete colors[source]
  if(type==='rename'&&target&&Number.isInteger(sourceColor)&&!Number.isInteger(colors[target]))colors[target]=sourceColor
  return{updates,registry:cleanRegistry(projected,colors),count:updates.length,name:sourceName,targetName:replacement,merged:Boolean(existing&&target!==source)}
}
