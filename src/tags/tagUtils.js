import { TAG_MAX, TAGS_PER_ITEM } from '@/lib/limits'

export const TAG_HUES=[8,24,42,75,135,168,195,220,248,275,315,340]
export const TAG_COLOR_NAMES=['Đỏ san hô','Cam','Hổ phách','Chanh','Lục','Ngọc','Xanh trời','Lam','Chàm','Tím','Hồng','Hoa hồng']

export const normalizeTag=value=>String(value??'').trim().replace(/^#+/,'').trim().replace(/\s+/gu,' ').normalize('NFC')
export const tagKey=name=>String(name??'').trim().normalize('NFC').toLocaleLowerCase('vi')
export function normalizeTags(values){
 const result=[],seen=new Set()
 for(const value of Array.isArray(values)?values:[]){const name=normalizeTag(value),key=tagKey(name);if(!name||Array.from(name).length>TAG_MAX||seen.has(key))continue;seen.add(key);result.push(name);if(result.length===TAGS_PER_ITEM)break}
 return result
}
const hash=value=>{let result=0x811c9dc5;for(const byte of new TextEncoder().encode(value)){result^=byte;result=Math.imul(result,0x01000193)}return result>>>0}
export const colorFallback=key=>hash(tagKey(key))%12
export function assignColor(key,registry={c:{}}){
 const normalized=tagKey(key),colors=registry?.c||{}
 if(Number.isInteger(colors[normalized])&&colors[normalized]>=0&&colors[normalized]<12)return colors[normalized]
 const usage=Array(12).fill(0);for(const value of Object.values(colors))if(Number.isInteger(value)&&value>=0&&value<12)usage[value]+=1
 const least=Math.min(...usage),start=colorFallback(normalized)
 for(let offset=0;offset<12;offset++){const index=(start+offset)%12;if(usage[index]===least)return index}
 return start
}
export function buildCatalog(tasks=[],registry={c:{}}){
 const catalog=new Map()
 for(const task of tasks||[]){const used=task.updatedAt||task.createdAt||'';for(const name of normalizeTags(task.tags)){const key=tagKey(name),current=catalog.get(key),registered=registry?.c?.[key],color=Number.isInteger(registered)&&registered>=0&&registered<12?registered:colorFallback(key);if(current){current.count+=1;if(used>current.lastUsed)current.lastUsed=used}else catalog.set(key,{name,key,count:1,lastUsed:used,color})}}
 return [...catalog.values()].sort((a,b)=>b.count-a.count||String(b.lastUsed).localeCompare(String(a.lastUsed))||a.name.localeCompare(b.name,'vi'))
}
export const withNormalizedTaskTags=task=>({...task,tags:normalizeTags(task?.tags)})
