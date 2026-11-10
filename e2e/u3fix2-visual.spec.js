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

test('nút hoàn thành rỗng khi chưa xong và có dấu check khi đã xong',async({page})=>{
  await page.goto('/')
  const incomplete=page.getByRole('button',{name:/Đánh dấu hoàn thành:/}).first()
  const done=page.getByRole('button',{name:/Mở lại:/}).first()
  await expect(incomplete).toBeVisible()
  await expect(incomplete.locator('svg')).toHaveCount(0)
  await expect(done.locator('svg')).toHaveCount(1)
})

test('Tổng quan dùng nhãn Thêm lịch trình và mở tạo nhiệm vụ',async({page})=>{
  await page.goto('/')
  await page.getByRole('button',{name:'Thêm lịch trình'}).click()
  await expect(page.getByRole('dialog',{name:'Tạo nhiệm vụ'})).toBeVisible()
})

test('quá hạn có nhãn chữ và thẻ theo màu dự án',async({page})=>{
  await page.goto('/cong-viec')
  const overdue=page.locator('.task-card.due-overdue').first()
  await expect(overdue.getByText('Quá hạn',{exact:true})).toBeVisible()
  await expect(overdue).toHaveClass(/has-project/)
  const tinted=await overdue.evaluate(element=>getComputedStyle(element).backgroundColor!==getComputedStyle(document.documentElement).getPropertyValue('--surface').trim())
  expect(tinted).toBe(true)
  await page.evaluate(()=>{const value=JSON.parse(localStorage.getItem('nhip-viec-v1'));value.tasks[0].projectId=null;localStorage.setItem('nhip-viec-v1',JSON.stringify(value))})
  await page.reload()
  await expect(page.getByRole('button',{name:'Chốt kế hoạch ra mắt',exact:true}).locator('xpath=ancestor::article')).not.toHaveClass(/has-project/)
})
