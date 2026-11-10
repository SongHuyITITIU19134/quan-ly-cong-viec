import { test, expect } from '@playwright/test'
import { makeDemoData } from '../scripts/make-demo-data.mjs'

const demo=makeDemoData().data
const settings={onboardingSeen:true,theme:'light',defaultView:'dashboard',reportPeriod:'week'}

test.beforeEach(async({page})=>{
  await page.addInitScript(({value,config})=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify(config))
    localStorage.setItem('nhip-viec-theme','light')
  },{value:demo,config:settings})
})

test('dải tuần hiển thị bảy ngày và chuyển tuần',async({page})=>{
  await page.goto('/lich')
  await page.getByRole('button',{name:'Tuần',exact:true}).click()
  await expect(page.locator('.calendar-day')).toHaveCount(7)
  const first=await page.locator('.calendar-day').first().textContent()
  await page.getByRole('button',{name:'Sau'}).click()
  await expect(page.locator('.calendar-day').first()).not.toHaveText(first)
})

test('agenda ngày đã chọn hiển thị việc và chuyến đi',async({page})=>{
  await page.goto('/lich')
  const agenda=page.getByRole('region',{name:'Ngày đã chọn'})
  await expect(agenda.getByRole('button',{name:'Chốt kế hoạch ra mắt'})).toBeVisible()
  await expect(agenda).toContainText('Làm việc cùng đội vận hành')
})

test('thẻ công tác phân biệt đang diễn ra và sắp tới',async({page})=>{
  await page.goto('/cong-tac')
  await expect(page.locator('.trip-state-ongoing')).toContainText('Làm việc cùng đội vận hành')
  await expect(page.locator('.trip-state-upcoming')).toContainText('Khảo sát người dùng')
  await page.getByRole('button',{name:'Làm việc cùng đội vận hành',exact:true}).last().click()
  await expect(page.getByRole('dialog')).toContainText('Trước chuyến đi')
})
