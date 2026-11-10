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

test('menu tạo luôn nằm trọn trong viewport',async({page},testInfo)=>{
  test.skip(testInfo.project.name==='tablet-768','Yêu cầu chỉ kiểm tra 1280 và 360')
  await page.goto('/')
  const trigger=testInfo.project.name==='desktop-1280'
    ?page.getByRole('button',{name:'Tạo mới'})
    :page.locator('.dashboard-date-head .popover-trigger')
  await trigger.click()
  const box=await page.getByRole('menu').boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x+box.width).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth))
})

test('bảng Dự án giữ lưới và biểu đồ trong một vùng cuộn',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Bố cục desktop 1280x720')
  await page.setViewportSize({width:1280,height:720})
  await page.goto('/')
  await page.getByRole('button',{name:'Bảng tiếp theo'}).click()
  const panel=page.locator('.dashboard-center-panel'),projects=panel.locator('.dashboard-projects')
  const layout=await projects.evaluate(element=>{
    const grid=element.querySelector('.dashboard-project-grid').getBoundingClientRect()
    const chart=element.querySelector('.mini-bars').getBoundingClientRect()
    return{overflow:getComputedStyle(element).overflowY,chartBelow:chart.top>=grid.bottom,panelWidth:element.scrollWidth<=element.clientWidth}
  })
  expect(layout).toEqual({overflow:'auto',chartBelow:true,panelWidth:true})
})
