import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { writeFile } from 'node:fs/promises'
import { makeDemoData } from '../scripts/make-demo-data.mjs'

const demo=makeDemoData().data
const settings={onboardingSeen:true,theme:'light',defaultView:'dashboard',reportPeriod:'week'}
const empty={projects:[],tasks:[],contacts:[],trips:[],notebooks:[],notes:[]}

test.beforeEach(async({page},testInfo)=>{
  const initial=/trạng thái rỗng|nhập được/u.test(testInfo.title)?empty:demo
  await page.addInitScript(({value,config})=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify(config))
    localStorage.setItem('nhip-viec-theme','light')
  },{value:initial,config:settings})
  await page.goto('/')
})

test('các tab Tổng quan lọc đúng nhóm nhiệm vụ',async({page})=>{
  const list=page.locator('.dashboard-task-list')
  await page.getByRole('tab',{name:/Hôm nay/}).click()
  await expect(list.getByRole('button',{name:'Chốt kế hoạch ra mắt',exact:true})).toBeVisible()
  await expect(list.getByRole('button',{name:'Phỏng vấn khách hàng',exact:true})).toHaveCount(0)
  await page.getByRole('tab',{name:/Sắp tới/}).click()
  await expect(list.getByRole('button',{name:'Phỏng vấn khách hàng',exact:true})).toBeVisible()
  await page.getByRole('tab',{name:/Quá hạn/}).click()
  await expect(list.getByRole('button',{name:'Chốt bảng chỉ số tuần',exact:true})).toBeVisible()
})

test('dải tuần chuyển tuần trước và tuần sau',async({page})=>{
  const strip=page.locator('.week-strip')
  await expect(strip.locator('.is-today')).toHaveCount(1)
  await page.getByRole('button',{name:'Tuần sau'}).click()
  await expect(strip.locator('.is-today')).toHaveCount(0)
  await page.getByRole('button',{name:'Tuần trước'}).click()
  await expect(strip.locator('.is-today')).toHaveCount(1)
})

test('nút kiểm timeline hoàn thành nhiệm vụ hôm nay',async({page})=>{
  const timeline=page.getByRole('complementary',{name:'Lịch hôm nay'})
  await timeline.getByRole('button',{name:'Đánh dấu hoàn thành: Chốt kế hoạch ra mắt'}).click()
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-v1')).tasks.find(item=>item.id==='demo-task-1').status)).toBe('done')
})

test('chevron đổi giữa Việc của tôi và Dự án',async({page})=>{
  await expect(page.getByRole('heading',{name:'Việc của tôi'})).toBeVisible()
  await page.getByRole('button',{name:'Bảng tiếp theo'}).click()
  await expect(page.getByRole('heading',{name:'Dự án'})).toBeVisible()
  await expect(page.locator('.dashboard-project-grid')).toBeVisible()
  await expect(page.locator('.dashboard-panel-dots .is-active')).toHaveCount(1)
  await page.getByRole('button',{name:'Bảng trước'}).click()
  await expect(page.getByRole('heading',{name:'Việc của tôi'})).toBeVisible()
})

test('trạng thái rỗng vẫn giữ greeting và cột phải',async({page})=>{
  await expect(page.getByRole('heading',{name:/Hôm nay bạn có 0 việc/})).toBeVisible()
  await expect(page.getByRole('button',{name:'Tạo dự án đầu tiên'})).toBeVisible()
  await expect(page.getByRole('button',{name:'Dùng dữ liệu mẫu'})).toBeVisible()
  await expect(page.getByRole('button',{name:'Thêm lịch trình'})).toBeVisible()
  await expect(page.locator('.week-strip')).toBeVisible()
  await expect(page.getByText('Hôm nay chưa có lịch.')).toBeVisible()
})

test('demo JSON nhập được qua luồng Cài đặt',async({page})=>{
  await page.goto('/cai-dat')
  const path=fileURLToPath(new URL('../docs/design/demo-data.json',import.meta.url))
  await writeFile(path,`${JSON.stringify(makeDemoData(),null,2)}\n`)
  await page.getByLabel('Tệp JSON cần nhập').setInputFiles(path)
  const preview=page.getByRole('dialog',{name:'Xem trước dữ liệu nhập'})
  await expect(preview).toContainText('22 mục hợp lệ')
  await preview.getByRole('button',{name:'Nhập dữ liệu',exact:true}).click()
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-v1')).tasks.length)).toBe(14)
})

test('điều hướng sidebar không có mục bị cắt',async({page},testInfo)=>{
  if(testInfo.project.name==='mobile-360'){
    const nav=page.locator('.mobile-tabs')
    await expect(nav).toBeVisible()
    expect(await nav.locator('a,button').evaluateAll(items=>{
      const bounds=items[0].parentElement.getBoundingClientRect()
      return items.every(item=>{const box=item.getBoundingClientRect();return box.left>=bounds.left&&box.right<=bounds.right})
    })).toBe(true)
    return
  }
  const sidebar=page.locator('.shell-sidebar'),nav=page.getByRole('navigation',{name:'Điều hướng chính'})
  await expect(sidebar).toBeVisible()
  for(const name of ['Tổng quan','Công việc','Lịch','Công tác','Danh bạ','Sơ đồ','Sổ tay'])await expect(nav.getByRole('link',{name})).toHaveAttribute('aria-label',name)
  const layout=await sidebar.evaluate(element=>{
    const bounds=element.getBoundingClientRect(),links=[...element.querySelectorAll('.shell-nav-link')]
    return{inside:links.every(link=>{const box=link.getBoundingClientRect();return box.left>=bounds.left&&box.right<=bounds.right}),centers:links.map(link=>{const box=link.querySelector('svg').getBoundingClientRect();return box.left+box.width/2}),center:bounds.left+bounds.width/2}
  })
  expect(layout.inside).toBe(true)
  if(testInfo.project.name==='tablet-768')for(const center of layout.centers)expect(Math.abs(center-layout.center)).toBeLessThan(2)
})
