import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const demo=JSON.parse(await readFile(new URL('../docs/design/demo-data.json',import.meta.url),'utf8')).data
const iso=date=>date.toISOString().slice(0,10)
const addDays=(date,amount)=>{const value=new Date(`${date}T12:00:00`);value.setDate(value.getDate()+amount);return iso(value)}
const today=iso(new Date())
const monday=(()=>{const value=new Date(`${today}T12:00:00`),day=value.getDay()||7;value.setDate(value.getDate()-day+1);return iso(value)})()
const otherDay=monday===today?addDays(monday,1):monday

function gaugeData(done,{splitToday=false}={}){
  const template=demo.tasks[0]
  return{...demo,tasks:Array.from({length:10},(_,index)=>({...template,id:`gauge-${index}`,title:`Việc gauge ${index+1}`,dueDate:splitToday&&index>0?otherDay:today,startDate:splitToday&&index>0?otherDay:today,status:index<done?'done':'todo',order:index+1,completedAt:index<done?today:null}))}
}

async function install(page,data=gaugeData(6),theme='light'){
  await page.addInitScript(({value,selectedTheme})=>{
    if(sessionStorage.getItem('u3fix6-seeded'))return
    sessionStorage.setItem('u3fix6-seeded','true')
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-period','week')
    localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:selectedTheme}))
    localStorage.setItem('nhip-viec-theme',selectedTheme)
  },{value:data,selectedTheme:theme})
}

test('đổi period cập nhật completion gauge',async({page})=>{
  await install(page,gaugeData(6,{splitToday:true}))
  await page.goto('/')
  await expect(page.getByRole('img',{name:/Hoàn thành 6 trên 10 việc/})).toBeVisible()
  await page.getByLabel('Phạm vi báo cáo').selectOption('today')
  await expect(page.getByRole('img',{name:/Hoàn thành 1 trên 1 việc, 100 phần trăm, Đạt mục tiêu/})).toBeVisible()
})

test('mỗi breakpoint chỉ có một điểm vào tài khoản',async({page},testInfo)=>{
  await install(page)
  await page.goto('/')
  if(testInfo.project.name==='mobile-360'){
    await expect(page.locator('.mobile-header .mobile-profile .popover-trigger')).toBeVisible()
    await expect(page.locator('.workspace-menu')).toBeHidden()
  }else{
    await expect(page.locator('.workspace-menu .popover-trigger')).toBeVisible()
    await expect(page.locator('.shell-topbar .profile-menu')).toHaveCount(0)
    await expect(page.locator('.dashboard-profile')).toHaveCount(0)
  }
})

for(const theme of ['light','dark'])test(`Tổng quan 1280x720 không cuộn trang ở ${theme}`,async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Yêu cầu riêng cho desktop 1280x720')
  await page.setViewportSize({width:1280,height:720})
  await install(page,gaugeData(6),theme)
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme)
  const fits=await page.evaluate(()=>({document:document.scrollingElement.scrollHeight<=innerHeight,main:document.querySelector('.main').scrollHeight<=document.querySelector('.main').clientHeight}))
  expect(fits).toEqual({document:true,main:true})
})

test('chụp gauge danger, ok, good, achieved ở light và dark',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Chỉ tạo ảnh chuẩn desktop')
  await page.setViewportSize({width:1280,height:720})
  await install(page,gaugeData(1),'light')
  await page.goto('/')
  for(const [state,done] of [['danger',1],['ok',6],['good',8],['achieved',10]])for(const theme of ['light','dark']){
    await page.evaluate(({value,selectedTheme})=>{
      localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
      localStorage.setItem('nhip-viec-period','week')
      localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:selectedTheme}))
      localStorage.setItem('nhip-viec-theme',selectedTheme)
    },{value:gaugeData(done),selectedTheme:theme})
    await page.reload()
    await expect(page.locator(`.completion-gauge.gauge-${state}`)).toBeVisible()
    await page.waitForTimeout(700)
    await page.screenshot({path:`docs/design/u3fix6/gauge-${state}-${theme}.png`,fullPage:false})
  }
})
