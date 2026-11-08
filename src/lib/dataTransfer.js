import { normalizeImportDoc } from '@/lib/importData'
import { EXPORT_SCHEMA_VERSION, IMPORT_BATCH_MAX, IMPORT_FILE_MAX_BYTES, IMPORT_ITEM_MAX } from '@/lib/limits'

export const DATA_COLLECTIONS=['projects','tasks','contacts','trips','notebooks','notes']

const cleanItem=item=>Object.fromEntries(Object.entries(item||{}).filter(([key])=>!['uid','token','emailVerified'].includes(key)))

export function buildJsonExport(data,createdAt=new Date().toISOString()){
  return{schemaVersion:EXPORT_SCHEMA_VERSION,createdAt,data:Object.fromEntries(DATA_COLLECTIONS.map(name=>[name,(data[name]||[]).map(cleanItem)]))}
}

export function stringifyJsonExport(data,createdAt){return JSON.stringify(buildJsonExport(data,createdAt),null,2)}

export function parseJsonImport(text,{size=String(text).length}={}){
  if(size>IMPORT_FILE_MAX_BYTES)throw new Error('Tệp vượt quá giới hạn cho phép')
  let input
  try{input=JSON.parse(text)}catch{throw new Error('Tệp JSON không hợp lệ')}
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Cấu trúc tệp không hợp lệ')
  const version=Number(input.schemaVersion||1)
  if(version<1||version>EXPORT_SCHEMA_VERSION)throw new Error('Phiên bản dữ liệu chưa được hỗ trợ')
  const source=input.data&&typeof input.data==='object'?input.data:input
  const data={}
  let invalid=0,total=0
  for(const name of DATA_COLLECTIONS){
    const values=source[name]??[]
    if(!Array.isArray(values))throw new Error(`Danh mục ${name} không hợp lệ`)
    data[name]=values.map(item=>normalizeImportDoc(name,item)).filter(item=>{total+=1;if(!item)invalid+=1;return Boolean(item)})
  }
  if(total>IMPORT_ITEM_MAX)throw new Error('Tệp chứa quá nhiều mục')
  return{schemaVersion:version,data,invalid}
}

export function importPreview(imported,current={}){
  const counts={},conflicts=[]
  for(const name of DATA_COLLECTIONS){const ids=new Set((current[name]||[]).map(item=>item.id));counts[name]=(imported[name]||[]).length;for(const item of imported[name]||[])if(ids.has(item.id))conflicts.push({collection:name,id:item.id})}
  return{counts,total:Object.values(counts).reduce((sum,value)=>sum+value,0),conflicts}
}

export function buildImportOps(imported,current={},conflict='skip'){
  const ops=[]
  for(const name of DATA_COLLECTIONS){const ids=new Set((current[name]||[]).map(item=>item.id));for(const item of imported[name]||[]){if(ids.has(item.id)){if(conflict==='overwrite')ops.push({type:'update',collection:name,id:item.id,data:item});continue}ops.push({type:'create',collection:name,id:item.id,data:item})}}
  return ops
}

const safeCsvValue=value=>/^[=+\-@\t]/u.test(String(value??''))?`'${String(value??'')}`:String(value??'')
const csvCell=value=>`"${safeCsvValue(value).replace(/"/gu,'""')}"`
export function tasksToCsv(tasks=[]){
  const fields=['id','title','status','priority','startDate','dueDate','projectId','assigneeId','progress','tags','seriesId','repeat']
  const rows=tasks.map(task=>fields.map(field=>csvCell(field==='tags'?(task.tags||[]).join('|'):field==='repeat'&&task.repeat?JSON.stringify(task.repeat):task[field])).join(','))
  return `\uFEFF${fields.map(csvCell).join(',')}\r\n${rows.join('\r\n')}\r\n`
}

const icsEscape=value=>String(value??'').replace(/\\/gu,'\\\\').replace(/\r?\n/gu,'\\n').replace(/,/gu,'\\,').replace(/;/gu,'\\;')
const icsDate=value=>String(value||'').replaceAll('-','')
const nextDay=value=>{const[year,month,day]=value.split('-').map(Number),date=new Date(year,month-1,day+1);return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export function dataToIcs({tasks=[],trips=[]}){
  const events=[]
  for(const task of tasks.filter(item=>item.dueDate)){const start=task.startDate||task.dueDate;events.push(['BEGIN:VEVENT',`UID:task-${icsEscape(task.id)}@nhip-viec`,`SUMMARY:${icsEscape(task.title)}`,`DTSTART;VALUE=DATE:${icsDate(start)}`,`DTEND;VALUE=DATE:${icsDate(nextDay(task.dueDate))}`,'END:VEVENT'])}
  for(const trip of trips.filter(item=>item.startDate&&item.endDate)){events.push(['BEGIN:VEVENT',`UID:trip-${icsEscape(trip.id)}@nhip-viec`,`SUMMARY:${icsEscape(trip.name)}`,`LOCATION:${icsEscape(trip.location)}`,`DESCRIPTION:${icsEscape(trip.purpose)}`,`DTSTART;VALUE=DATE:${icsDate(trip.startDate)}`,`DTEND;VALUE=DATE:${icsDate(nextDay(trip.endDate))}`,'END:VEVENT'])}
  return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nhip Viec//VI',...events.flat(),'END:VCALENDAR',''].join('\r\n')
}

export async function runImportBatches(ops,write,{batchSize=IMPORT_BATCH_MAX}={}){
  const batches=[]
  for(let index=0;index<ops.length;index+=batchSize)batches.push(ops.slice(index,index+batchSize))
  let written=0
  for(let index=0;index<batches.length;index+=1){
    try{const result=await write(batches[index]);if(!result)throw new Error('Không thể ghi dữ liệu');written+=batches[index].length}
    catch(error){const failure=new Error(`Đợt ${index+1}/${batches.length} lỗi; đã ghi ${written} mục`,{cause:error});failure.written=written;failure.batch=index+1;failure.totalBatches=batches.length;throw failure}
  }
  return{written,batches:batches.length}
}
