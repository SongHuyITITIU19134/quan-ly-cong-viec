import { chromium } from '@playwright/test'

const baseUrl=process.env.PERF_BASE_URL||'http://127.0.0.1:4173'
const taskCount=Number(process.env.PERF_TASKS||5000)
const runs=Math.max(1,Number(process.env.PERF_RUNS||1))
const cpuRate=Math.max(1,Number(process.env.PERF_CPU_RATE||1))
const median=values=>{
  const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2)
  return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2
}
const toDate=value=>value.toISOString().slice(0,10)
const today=new Date(),projects=Array.from({length:50},(_,index)=>({
  id:`project-${index}`,name:`Dự án hiệu năng ${index+1}`,status:'running',createdAt:today.toISOString(),updatedAt:today.toISOString(),
}))
const tasks=Array.from({length:taskCount},(_,index)=>{
  const due=new Date(today)
  due.setDate(today.getDate()+(index%365)-30)
  return {
    id:`perf-${index}`,title:`Nhiệm vụ hiệu năng ${index+1}`,status:['todo','doing','waiting','done'][index%4],
    priority:['low','medium','high','urgent'][index%4],progress:index%4===3?100:index%100,dueDate:toDate(due),
    startDate:'',projectId:`project-${index%projects.length}`,assigneeId:'self',assignerId:'self',collaboratorIds:[],
    tags:index%3===0?['hiệu năng']:[],order:index,createdAt:today.toISOString(),updatedAt:today.toISOString(),
  }
})
const data={projects,tasks,contacts:[{id:'self',fullName:'Tôi',isSelf:true}],trips:[],notebooks:[],notes:[]}
const browser=await chromium.launch()
const context=await browser.newContext({viewport:{width:1366,height:768}})
await context.addInitScript(payload=>{
  localStorage.setItem('nhip-viec-v1',JSON.stringify(payload))
  localStorage.setItem('nhip-viec-initialized','true')
},data)
const page=await context.newPage()
const cdp=await context.newCDPSession(page)
if(cpuRate>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate})
page.setDefaultTimeout(120000)
page.on('pageerror',error=>console.error(`Page error: ${error.message}`))
page.on('console',message=>{if(message.type()==='error')console.error(`Browser error: ${message.text()}`)})
await page.goto(baseUrl,{waitUntil:'networkidle'})
const firstRouteJsGzip=await page.evaluate(()=>performance.getEntriesByType('resource')
  .filter(entry=>entry.name.includes('/assets/')&&entry.name.endsWith('.js'))
  .reduce((sum,entry)=>sum+entry.encodedBodySize,0))
for(const route of ['/lich','/cong-viec']){await page.goto(`${baseUrl}${route}`,{waitUntil:'domcontentloaded'});await page.locator('.page h1').waitFor()}
const measure=async(route,label)=>{
  await page.goto(`${baseUrl}/danh-ba`,{waitUntil:'domcontentloaded'})
  await page.locator('.page h1').waitFor()
  await page.evaluate(path=>{
    window.__renderStart=performance.now()
    document.querySelector(`a[href="${path}"]`)?.click()
  },route)
  await page.waitForURL(url=>url.pathname===route)
  await page.locator('.page h1').waitFor()
  if(route==='/cong-viec')await page.locator('[data-render-complete="true"]').waitFor()
  const milliseconds=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now()-window.__renderStart)))))
  return {route:label,tasks:taskCount,milliseconds:Number(milliseconds.toFixed(1))}
}
const samples={Dashboard:[],Calendar:[],Tasks:[]}
for(let run=0;run<runs;run+=1)for(const [route,label] of [['/','Dashboard'],['/lich','Calendar'],['/cong-viec','Tasks']]){
  const result=await measure(route,label)
  samples[label].push(result.milliseconds)
}
const results=Object.entries(samples).map(([route,values])=>({
  route,tasks:taskCount,cpu:`${cpuRate}x`,runs,medianMs:Number(median(values).toFixed(1)),samples:values.join(', ')
}))
console.table(results)
console.log(`JS gzip lần đầu /: ${(firstRouteJsGzip/1024).toFixed(1)} kB`)
if(process.env.PERF_SKIP_OFFLINE!=='1'){
  await page.goto(baseUrl,{waitUntil:'domcontentloaded'})
  await page.waitForFunction(async()=>{await navigator.serviceWorker?.ready;return Boolean(navigator.serviceWorker?.controller)})
  await context.setOffline(true)
  await page.reload({waitUntil:'domcontentloaded'})
  await page.locator('.page h1').waitFor()
  console.log('Offline: OK')
}
await browser.close()
if(cpuRate===1&&results[0].medianMs>=150){console.error(`Dashboard vượt cổng 150ms: ${results[0].medianMs}ms`);process.exitCode=1}
