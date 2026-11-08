import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const baseUrl=process.env.PWA_BASE_URL||'http://127.0.0.1:4173'
const swPath=new URL('../dist/sw.js',import.meta.url)
const original=await readFile(swPath,'utf8')
const updated=original.replace(/const CACHE='([^']+)'/,(_match,name)=>`const CACHE='${name}-verification'`)+`\n// verification ${Date.now()}\n`
const browser=await chromium.launch()
const context=await browser.newContext()
const page=await context.newPage()

try{
  await page.goto(baseUrl,{waitUntil:'networkidle'})
  await page.waitForFunction(async()=>{await navigator.serviceWorker.ready;return Boolean(navigator.serviceWorker.controller)})
  const oldCaches=await page.evaluate(()=>caches.keys())
  await context.setOffline(true)
  await page.reload({waitUntil:'domcontentloaded'})
  await page.locator('.page h1').waitFor()
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
