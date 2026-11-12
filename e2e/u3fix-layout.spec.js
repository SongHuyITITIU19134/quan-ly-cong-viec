import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const demo=JSON.parse(await readFile(new URL('../docs/design/demo-data.json',import.meta.url),'utf8')).data

test.beforeEach(async({page})=>{
  await page.addInitScript(value=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-notebooks',JSON.stringify(value.notebooks||[]))
    localStorage.setItem('nhip-viec-notes',JSON.stringify(value.notes||[]))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:'light'}))
  },demo)
})

test('bốn trang chính không cuộn khung trang ở 1280x720',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Yêu cầu riêng cho desktop 1280x720')
  await page.setViewportSize({width:1280,height:720})
  for(const route of ['/','/lich','/cong-tac','/so-do']){
    await page.goto(route)
    await expect(page.locator('.page')).toBeVisible()
    const size=await page.evaluate(()=>({document:document.scrollingElement.scrollHeight<=innerHeight,main:document.querySelector('.main').scrollHeight<=document.querySelector('.main').clientHeight}))
    expect(size,route).toEqual({document:true,main:true})
  }
})

test('ô tháng chỉ hiện hai mục và phần còn lại chọn đúng ngày',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Kiểm tra bố cục tháng trên desktop')
  await page.setViewportSize({width:1280,height:720})
  await page.goto('/lich')
  const busyDay=page.locator('.calendar-day').filter({hasText:/\+\d+ mục khác/u}).first()
  await expect(busyDay.locator('.calendar-task,.trip-strip')).toHaveCount(2)
  const selectedDate=(await busyDay.getAttribute('aria-label')).split(',')[0]
  await busyDay.getByText(/\+\d+ mục khác/u).click()
  await expect(page.getByRole('region',{name:'Ngày đã chọn'}).getByRole('heading')).toHaveText(selectedDate)
})
