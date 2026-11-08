import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173'
const phase = process.argv[2] || 'fix-before'
const screenshotRoot = path.resolve(`docs/screenshots/${phase}`)
const auditRoot = path.resolve('docs/audit')

const viewports = [
  ['laptop-1280x720',1280,720],['laptop-1366x768',1366,768],['laptop-1440x900',1440,900],
  ['laptop-1512x982',1512,982],['laptop-1536x864',1536,864],['desktop-1920x1080',1920,1080],
  ['desktop-2560x1440',2560,1440],['tablet-768x1024',768,1024],['tablet-820x1180',820,1180],
  ['tablet-1024x768',1024,768],['phone-360x640',360,640],['phone-375x667',375,667],
  ['phone-390x844',390,844],['phone-412x915',412,915],['phone-430x932',430,932],['phone-landscape-844x390',844,390],
]
const routes = [['dashboard','/'],['tasks','/cong-viec'],['calendar','/lich'],['trips','/cong-tac'],['contacts','/danh-ba']]

const browser = await chromium.launch()
await mkdir(screenshotRoot,{recursive:true})
await mkdir(auditRoot,{recursive:true})
const findings=[]

async function inspectPage(page,meta){
  const result=await page.evaluate(()=>{
    const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0}
    const main=document.querySelector('.main')?.getBoundingClientRect()
    const rect=el=>{const r=el.getBoundingClientRect(),clipped=main&&el.closest('.main')?{x:Math.max(r.x,main.x),y:Math.max(r.y,main.y),right:Math.min(r.right,main.right),bottom:Math.min(r.bottom,main.bottom)}:{x:r.x,y:r.y,right:r.right,bottom:r.bottom};return {...clipped,width:Math.max(0,clipped.right-clipped.x),height:Math.max(0,clipped.bottom-clipped.y),label:(el.getAttribute('aria-label')||el.textContent||el.tagName).trim().slice(0,80)}}
    const interactive=[...document.querySelectorAll('button,a[href],input,select,textarea,summary')].filter(visible)
    const boxes=interactive.map(el=>({...rect(el),element:el}))
    const overlaps=[]
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i],b=boxes[j]
      if(a.element.contains(b.element)||b.element.contains(a.element))continue
      const area=Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y))
      if(area>16)overlaps.push({a:a.label,b:b.label,area:Math.round(area)})
    }
    const width=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)
    return {viewport:{width:innerWidth,height:innerHeight},documentWidth:width,horizontalOverflow:Math.max(0,width-innerWidth),overlaps:overlaps.slice(0,30),interactiveCount:boxes.length}
  })
  findings.push({...meta,...result})
}

for(const [viewportName,width,height] of viewports){
  const context=await browser.newContext({viewport:{width,height},colorScheme:'light',isMobile:width<600,hasTouch:width<1100})
  const page=await context.newPage()
  for(const theme of ['light','dark']){
    await page.addInitScript(value=>localStorage.setItem('nhip-viec-theme',value),theme)
    for(const [routeName,route] of routes){
      await page.goto(`${baseURL}${route}`,{waitUntil:'networkidle'})
      await page.screenshot({path:path.join(screenshotRoot,`${routeName}-${theme}-${viewportName}.png`),fullPage:true})
      await inspectPage(page,{viewportName,routeName,theme})
    }
  }
  await page.goto(`${baseURL}/cong-viec`,{waitUntil:'networkidle'})
  await page.getByRole('button',{name:/Tạo nhiệm vụ|Tạo việc/}).first().click()
  await page.waitForTimeout(300)
  const save=page.getByRole('button',{name:'Lưu'}).last()
  const saveBox=await save.boundingBox()
  findings.push({viewportName,scenario:'task-form-save',saveBox,saveVisible:Boolean(saveBox&&saveBox.y>=0&&saveBox.y+saveBox.height<=height)})
  await page.keyboard.press('Escape')
  const filter=page.getByText(/^Trạng thái/).first()
  if(await filter.count()){
    await filter.click()
    const panel=page.locator('.filter-panel fieldset').first()
    const box=await panel.boundingBox()
    findings.push({viewportName,scenario:'filter-menu',box,inViewport:Boolean(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height)})
    await page.keyboard.press('Escape')
  }
  await page.locator('.main').evaluate(element=>element.scrollTo(0,element.scrollHeight))
  const bottom=await page.evaluate(()=>{
    const dock=document.querySelector('.floating-dock')?.getBoundingClientRect()
    const candidates=[...document.querySelectorAll('main button,main a,main input,main select')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height})
    const last=candidates.sort((a,b)=>a.getBoundingClientRect().bottom-b.getBoundingClientRect().bottom).at(-1)?.getBoundingClientRect()
    if(!dock||!last)return {covered:false}
    return {covered:last.bottom>dock.top&&last.top<dock.bottom,dock:{top:dock.top,bottom:dock.bottom},last:{top:last.top,bottom:last.bottom}}
  })
  findings.push({viewportName,scenario:'dock-bottom-obstruction',...bottom})
  await context.close()
}

const perfContext=await browser.newContext({viewport:{width:1366,height:768}})
const perfPage=await perfContext.newPage()
const cdp=await perfContext.newCDPSession(perfPage)
await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})
await perfPage.goto(`${baseURL}/`,{waitUntil:'networkidle'})
for(const route of ['/cong-viec','/lich','/cong-tac','/danh-ba','/']){await perfPage.goto(`${baseURL}${route}`,{waitUntil:'networkidle'})}
await perfPage.evaluate(()=>{
  window.__uiLongTasks=[]
  new PerformanceObserver(list=>window.__uiLongTasks.push(...list.getEntries().map(entry=>({start:entry.startTime,duration:entry.duration})))).observe({type:'longtask',buffered:true})
  window.__frameIntervals=[]
  let previous=performance.now(),remaining=240
  const sample=now=>{window.__frameIntervals.push(now-previous);previous=now;if(--remaining>0)requestAnimationFrame(sample)}
  requestAnimationFrame(sample)
})
for(const route of ['/cong-viec','/lich','/cong-tac','/danh-ba','/']){
  await perfPage.locator(`a[href="${route}"]`).last().click()
  await perfPage.waitForTimeout(350)
}
await perfPage.locator('a[href="/cong-viec"]').last().click()
await perfPage.waitForTimeout(300)
await perfPage.getByRole('button',{name:/Tạo nhiệm vụ|Tạo việc/}).first().click()
await perfPage.waitForTimeout(350)
await perfPage.keyboard.press('Escape')
await perfPage.waitForTimeout(300)
await perfPage.locator('.dock-link').first().hover()
await perfPage.waitForTimeout(250)
const performance=await perfPage.evaluate(()=>{
  const intervals=window.__frameIntervals||[]
  const dropped=intervals.filter(value=>value>25).length
  return {longTasks:window.__uiLongTasks||[],frameSamples:intervals.length,droppedFrames:dropped,worstFrameMs:Math.max(0,...intervals),p95FrameMs:intervals.sort((a,b)=>a-b)[Math.floor(intervals.length*.95)]||0}
})
await perfContext.close()
await browser.close()

const report={generatedAt:new Date().toISOString(),phase,baseURL,viewports:viewports.length,routes:routes.length,findings,performance}
await writeFile(path.join(auditRoot,`${phase}-measurements.json`),JSON.stringify(report,null,2))
console.log(JSON.stringify({phase,screenshots:viewports.length*routes.length*2,overflow:findings.filter(x=>x.horizontalOverflow>0).length,overlaps:findings.reduce((n,x)=>n+(x.overlaps?.length||0),0),hiddenSave:findings.filter(x=>x.scenario==='task-form-save'&&!x.saveVisible).length,coveredBottom:findings.filter(x=>x.scenario==='dock-bottom-obstruction'&&x.covered).length,performance},null,2))
