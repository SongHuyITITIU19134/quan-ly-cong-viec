import { emptyData } from './seed'
import { migrateData } from '@/lib/projects'
import { assignColor, normalizeTags, tagKey, withNormalizedTaskTags } from '@/tags/tagUtils'
import { localNoteSeed } from './noteSeed'
import { normalizeTrip } from '@/lib/trips'
import { ensureSelfContact } from '@/lib/contacts'
const KEY='nhip-viec-v1'
const INITIALIZED='nhip-viec-initialized'
const TAG_COLORS='nhip-viec-tag-colors',TAG_EVENT='nhip-viec-tag-colors-change'
const EXTRA_KEYS={notebooks:'nhip-viec-notebooks',notes:'nhip-viec-notes'}
const RECOVERY='Không đọc được dữ liệu cũ. Bản gốc đã được giữ lại.'
const recover=()=>({...emptyData(),recoveryError:RECOVERY})
const readExtras=()=>{
 let notebookRaw,noteRaw
 try{notebookRaw=localStorage.getItem(EXTRA_KEYS.notebooks);noteRaw=localStorage.getItem(EXTRA_KEYS.notes)}catch{return{notebooks:[],notes:[],recoveryError:RECOVERY}}
 try{
  if(notebookRaw===null&&noteRaw===null){const seed=localNoteSeed();localStorage.setItem(EXTRA_KEYS.notebooks,JSON.stringify(seed.notebooks));localStorage.setItem(EXTRA_KEYS.notes,JSON.stringify(seed.notes));return seed}
  const notebooks=notebookRaw===null?[]:JSON.parse(notebookRaw),notes=noteRaw===null?[]:JSON.parse(noteRaw)
  if(!Array.isArray(notebooks)||!Array.isArray(notes))throw new Error('Invalid notes data')
  if(notebookRaw===null)localStorage.setItem(EXTRA_KEYS.notebooks,'[]')
  if(noteRaw===null)localStorage.setItem(EXTRA_KEYS.notes,'[]')
  return{notebooks,notes}
 }catch{return{notebooks:[],notes:[],recoveryError:RECOVERY}}
}
const readCore=()=>{
 let raw
 try{raw=localStorage.getItem(KEY)}catch{return recover()}
 if(raw===null){
  let initialized
  try{initialized=localStorage.getItem(INITIALIZED)}catch{return recover()}
  if(initialized!==null){const data=ensureSelfContact(emptyData()).data;try{localStorage.setItem(KEY,JSON.stringify(data))}catch{return recover()}return data}
  const data=ensureSelfContact(emptyData()).data
  try{localStorage.setItem(KEY,JSON.stringify(data));localStorage.setItem(INITIALIZED,'true')}catch{return recover()}
  return data
 }
 let parsed
 try{if(raw==='')throw new Error('Empty storage');parsed=JSON.parse(raw)}catch{
  if(raw!=='')try{localStorage.setItem(`${KEY}.corrupt-${new Date().toISOString()}`,raw)}catch{/* Keep the original key untouched if backup fails. */}
  return recover()
 }
 let data
 try{
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid dataset')
  data=migrateData(parsed)
  data=ensureSelfContact({...data,trips:(data.trips||[]).map(normalizeTrip)}).data
 }catch{return recover()}
 try{
  if(localStorage.getItem(`${KEY}.pre-migration`)===null)localStorage.setItem(`${KEY}.pre-migration`,raw)
  localStorage.setItem(INITIALIZED,'true')
  if(JSON.stringify(data)!==raw)localStorage.setItem(KEY,JSON.stringify(data))
 }catch{return recover()}
 return data
}
const read=()=>{const core=readCore();if(core.recoveryError)return core;const extra=readExtras();return{...core,...extra,...(extra.recoveryError?{recoveryError:extra.recoveryError}:{})}}
const writableData=()=>{const data=read();if(data.recoveryError)throw new Error(data.recoveryError);return data}
const writableExtras=()=>{const data=readExtras();if(data.recoveryError)throw new Error(data.recoveryError);return data}
const notify=()=>window.dispatchEvent(new CustomEvent('nhip-viec-change'))
const writeCore=data=>{try{const{projects,tasks,contacts,trips}=data;localStorage.setItem(KEY,JSON.stringify({projects,tasks,contacts,trips}))}catch(error){throw new Error(`Không thể lưu dữ liệu trên trình duyệt: ${error.message}`,{cause:error})}}
const writeExtra=(collection,items)=>{try{localStorage.setItem(EXTRA_KEYS[collection],JSON.stringify(items))}catch(error){throw new Error(`Không thể lưu dữ liệu trên trình duyệt: ${error.message}`,{cause:error})}}
const write=data=>{writeCore(data);notify()}
const readTagColors=()=>{try{const parsed=JSON.parse(localStorage.getItem(TAG_COLORS));if(!parsed?.c||typeof parsed.c!=='object'||Array.isArray(parsed.c))return{c:{}};return{c:Object.fromEntries(Object.entries(parsed.c).filter(([,value])=>Number.isInteger(value)&&value>=0&&value<12))}}catch{return{c:{}}}}
const writeTagColors=registry=>{try{localStorage.setItem(TAG_COLORS,JSON.stringify(registry));window.dispatchEvent(new CustomEvent(TAG_EVENT));return true}catch{return false}}
const RAW_KEYS=[KEY,...Object.values(EXTRA_KEYS),TAG_COLORS]
const snapshotRaw=()=>Object.fromEntries(RAW_KEYS.map(key=>[key,localStorage.getItem(key)]))
const restoreRaw=snapshot=>{for(const [key,value] of Object.entries(snapshot))if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}
export const localRepo={
 getSettings(){try{const parsed=JSON.parse(localStorage.getItem('nhip-viec-settings')||'{}');return{theme:parsed.theme||localStorage.getItem('nhip-viec-theme')||'system',defaultView:parsed.defaultView||'dashboard',reportPeriod:parsed.reportPeriod||localStorage.getItem('nhip-viec-period')||'week'}}catch{return{theme:'system',defaultView:'dashboard',reportPeriod:'week'}}},
 async saveSettings(settings){localStorage.setItem('nhip-viec-settings',JSON.stringify(settings));localStorage.setItem('nhip-viec-theme',settings.theme);localStorage.setItem('nhip-viec-period',settings.reportPeriod);window.dispatchEvent(new CustomEvent('nhip-viec-settings-change',{detail:settings}));return settings},
 subscribe(_collection,callback){const emit=()=>{const data=read();callback({...data,notebooks:data.notebooks||[],notes:data.notes||[],tasks:(data.tasks||[]).map(withNormalizedTaskTags)})};emit();window.addEventListener('nhip-viec-change',emit);window.addEventListener('storage',emit);return()=>{window.removeEventListener('nhip-viec-change',emit);window.removeEventListener('storage',emit)}},
 subscribeTagColors(callback){const emit=()=>callback(readTagColors());emit();window.addEventListener(TAG_EVENT,emit);window.addEventListener('storage',emit);return()=>{window.removeEventListener(TAG_EVENT,emit);window.removeEventListener('storage',emit)}},
 create(collection,value){const extra=Boolean(EXTRA_KEYS[collection]),data=extra?writableExtras():writableData(),item={...(collection==='trips'?normalizeTrip(value):value),id:value.id||crypto.randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};data[collection]=[...data[collection],item];if(extra)writeExtra(collection,data[collection]);else writeCore(data);notify();return Promise.resolve(item)},
 update(collection,id,patch){const extra=Boolean(EXTRA_KEYS[collection]),data=extra?writableExtras():writableData();data[collection]=data[collection].map(x=>x.id===id?{...x,...patch,updatedAt:new Date().toISOString()}:x);if(extra)writeExtra(collection,data[collection]);else writeCore(data);notify();return Promise.resolve()},
 remove(collection,id){if(collection==='contacts'&&id==='self')return Promise.reject(new Error('Không thể xóa liên hệ Tôi'));const extra=Boolean(EXTRA_KEYS[collection]),data=extra?writableExtras():writableData();data[collection]=data[collection].filter(x=>x.id!==id);if(extra)writeExtra(collection,data[collection]);else writeCore(data);notify();return Promise.resolve()},
 async batch(ops,knownRegistry,currentItems=[]){if(ops.some(op=>op.type==='remove'&&op.collection==='contacts'&&op.id==='self'))throw new Error('Không thể xóa liên hệ Tôi');const raw=snapshotRaw(),onlyExtra=ops.every(op=>EXTRA_KEYS[op.collection]),extras=onlyExtra?writableExtras():null,data=onlyExtra?{...emptyData(),...extras,tasks:currentItems.filter(item=>!item.notebookId)}:writableData(),now=new Date().toISOString(),touched=new Set();let touchesTags=false;for(const op of ops){const hasTags=['tasks','notes'].includes(op.collection)&&Object.hasOwn(op.data||{},'tags'),payload=hasTags?{...op.data,tags:normalizeTags(op.data.tags)}:op.data;if(['tasks','notes'].includes(op.collection)&&(hasTags||op.type==='remove'))touchesTags=true;touched.add(op.collection);if(op.type==='create')data[op.collection]=[...data[op.collection],{...payload,id:payload.id||op.id||crypto.randomUUID(),createdAt:payload.createdAt||now,updatedAt:now}];if(op.type==='update')data[op.collection]=data[op.collection].map(x=>x.id===op.id?{...x,...payload,updatedAt:now}:x);if(op.type==='remove')data[op.collection]=data[op.collection].filter(x=>x.id!==op.id)}try{if([...touched].some(collection=>!EXTRA_KEYS[collection]))writeCore(data);for(const collection of touched)if(EXTRA_KEYS[collection])writeExtra(collection,data[collection]);if(touchesTags){const disk=readTagColors(),registry={c:{...disk.c,...knownRegistry?.c}},used=[...new Set([...data.tasks,...data.notes].flatMap(item=>normalizeTags(item.tags).map(tagKey)))],next={c:{}};for(const key of used)if(Number.isInteger(registry.c[key]))next.c[key]=registry.c[key];for(const key of used)if(!Number.isInteger(next.c[key]))next.c[key]=assignColor(key,next);if(JSON.stringify(next)!==JSON.stringify(disk)&&!writeTagColors(next))throw new Error('Không thể lưu màu nhãn')}notify();return true}catch(error){restoreRaw(raw);throw error}},
 async saveTaskTags(taskId,values,knownRegistry){const tags=normalizeTags(values);await localRepo.update('tasks',taskId,{tags});const registry={c:{...readTagColors().c,...knownRegistry?.c}};let changed=false;for(const name of tags){const key=tagKey(name);if(!Number.isInteger(registry.c[key])){registry.c[key]=assignColor(key,registry);changed=true}}if(changed)writeTagColors(registry);return tags},
 async manageTags(updates,registry){await localRepo.batch(updates.map(item=>({type:'update',collection:item.collection||'tasks',id:item.id,data:{tags:item.tags}})),registry);return{updated:updates.length}},
 reset(){localStorage.setItem(INITIALIZED,'true');for(const key of Object.values(EXTRA_KEYS))localStorage.setItem(key,'[]');localStorage.removeItem(TAG_COLORS);write(ensureSelfContact(emptyData()).data)}
}
