import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const baseUrl=process.env.PWA_BASE_URL||'http://127.0.0.1:4173'
const swPath=new URL('../dist/sw.js',import.meta.url)
const original=await readFile(swPath,'utf8')
const updated=original.replace(/const CACHE=PREFIX\+'([^']+)'/,(_match,name)=>`const CACHE=PREFIX+'${name}-verification'`)+`\n// verification ${Date.now()}\n`
const browser=await chromium.launch()
const context=await browser.newContext()
const page=await context.newPage()
page.setDefaultTimeout(10000)
const browserErrors=[]
page.on('pageerror',error=>browserErrors.push(error.message))
page.on('console',message=>{if(message.type()==='error')browserErrors.push(message.text())})
page.on('requestfailed',request=>browserErrors.push(`${request.failure()?.errorText}: ${request.url()}`))

try{
  await page.goto(baseUrl,{waitUntil:'networkidle'})
  const installability=await page.evaluate(async()=>{
    const response=await fetch('/manifest.webmanifest'),manifest=await response.json()
    const icons=await Promise.all((manifest.icons||[]).map(async icon=>({
      ...icon,ok:(await fetch(icon.src)).ok
    })))
    return{manifest,icons}
  })
  if(installability.manifest.display!=='standalone')throw new Error('Manifest thiếu display standalone')
  if(!installability.icons.some(icon=>icon.ok&&icon.sizes==='192x192'&&icon.purpose.includes('maskable')))throw new Error('Thiếu icon 192 maskable')
  if(!installability.icons.some(icon=>icon.ok&&icon.sizes==='512x512'&&icon.purpose.includes('maskable')))throw new Error('Thiếu icon 512 maskable')
  await page.waitForFunction(async()=>{await navigator.serviceWorker.ready;return Boolean(navigator.serviceWorker.controller)})
  await page.reload({waitUntil:'networkidle'})
  await page.locator('.page h1').waitFor()
  const oldCaches=await page.evaluate(()=>caches.keys())
  const initialCacheState=await page.evaluate(async()=>{
    let count=0,urls=[]
    for(const key of await caches.keys()){const requests=await (await caches.open(key)).keys();count+=requests.length;urls=urls.concat(requests.map(item=>item.url))}
    const assets=[...document.scripts].map(item=>item.src).concat([...document.styleSheets].map(item=>item.href).filter(Boolean))
    return {count,assets:await Promise.all(assets.map(async url=>({url,cached:Boolean(await caches.match(url,{ignoreVary:true}))}))),urls,controller:navigator.serviceWorker.controller?.scriptURL}
  })
  if(!oldCaches.length||!initialCacheState.count||initialCacheState.assets.some(item=>!item.cached)){
    const expected=JSON.parse(original.match(/const PRECACHE=(\[[^\n]+\])/)[1]).map(path=>new URL(path,baseUrl).href)
    throw new Error(`Service worker chưa precache app shell: ${JSON.stringify({missing:expected.filter(url=>!initialCacheState.urls.includes(url)),unexpected:initialCacheState.urls.filter(url=>!expected.includes(url))})}`)
  }
  await context.setOffline(true)
  await page.reload({waitUntil:'domcontentloaded'})
  try{await page.locator('.page h1').waitFor()}
  catch(error){const state=await page.evaluate(()=>({title:document.title,text:document.body.innerText.slice(0,120),scripts:[...document.scripts].map(item=>item.src),controller:navigator.serviceWorker.controller?.scriptURL}));throw new Error(`Offline không render app: ${JSON.stringify({...state,initialCacheState,browserErrors})}`,{cause:error})}
  await context.setOffline(false)
  const cachedUrls=await page.evaluate(async()=>{
    const urls=[]
    for(const key of await caches.keys())for(const request of await (await caches.open(key)).keys())urls.push(request.url)
    return urls
  })
  if(cachedUrls.some(url=>!url.startsWith(baseUrl)))throw new Error('Cache chứa request ngoài origin ứng dụng')

  await writeFile(swPath,updated)
  await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update()})
  await page.getByText('Có bản mới, tải lại.').waitFor()
  await page.getByRole('button',{name:'Tải lại'}).click()
  await page.waitForLoadState('domcontentloaded')
  await page.locator('.page h1').waitFor()
  const newCaches=await page.evaluate(()=>caches.keys())
  if(oldCaches.some(key=>newCaches.includes(key)))throw new Error('Cache cũ chưa được thay thế')
  console.log(`PWA: offline OK; update toast OK; cache ${oldCaches.length}→${newCaches.length}; external requests cached: 0`)
}finally{
  await writeFile(swPath,original)
  await browser.close()
}
