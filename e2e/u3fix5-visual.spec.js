import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const demo=JSON.parse(await readFile(new URL('../docs/design/demo-data.json',import.meta.url),'utf8')).data
const notebook={id:'u3fix5-book',name:'Danh sách hoàn thiện giao diện',color:4,pinned:true,archived:false,createdAt:'2026-11-01'}
const notes=[
  {id:'u3fix5-note-1',notebookId:notebook.id,title:'Kiểm tra giao diện desktop',body:'Rà soát các vùng hành động ở mép phải.',tags:['UI'],pinned:false,links:{},updatedAt:'2026-11-02'},
  {id:'u3fix5-note-2',notebookId:notebook.id,title:'Kiểm tra giao diện mobile',body:'Đảm bảo nút sửa hiển thị đầy đủ.',tags:[],pinned:true,links:{},updatedAt:'2026-11-03'}
]

test.beforeEach(async({page})=>{
  await page.addInitScript(({value,book,noteRows})=>{
    const data={...value,notebooks:[book],notes:noteRows}
    localStorage.setItem('nhip-viec-v1',JSON.stringify(data))
    localStorage.setItem('nhip-viec-notebooks',JSON.stringify(data.notebooks))
    localStorage.setItem('nhip-viec-notes',JSON.stringify(data.notes))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:'light'}))
    localStorage.setItem('nhip-viec-theme','light')
  },{value:demo,book:notebook,noteRows:notes})
})

test('tiêu đề thẻ dự án không cắt glyph',async({page})=>{
  await page.setViewportSize({width:1280,height:720})
  await page.goto('/')
  await page.getByRole('button',{name:'Bảng tiếp theo'}).click()
  const title=page.locator('.dashboard-project-card>strong').first()
  await expect(title).toHaveAttribute('title',/.+/)
  expect(await title.evaluate(element=>element.scrollHeight<=element.clientHeight)).toBe(true)
})

test('nút sửa ghi chú nằm trọn trong viewport',async({page})=>{
  await page.goto(`/so-tay/${notebook.id}`)
  const edit=page.getByRole('button',{name:`Sửa: ${notes[0].title}`})
  await expect(edit).toBeVisible()
  const box=await edit.boundingBox(),viewport=page.viewportSize()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x+box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.height).toBeGreaterThanOrEqual(43.9)
})

test('header agenda giữ ngày và nút tạo nhiệm vụ trên một dòng',async({page})=>{
  await page.goto('/lich')
  const values=await page.locator('.day-agenda-head').evaluate(element=>[element.querySelector('h2'),element.querySelector('.button')].map(item=>({scroll:item.scrollWidth,client:item.clientWidth,whiteSpace:getComputedStyle(item).whiteSpace})))
  for(const item of values){expect(item.scroll).toBeLessThanOrEqual(item.client);expect(item.whiteSpace).toBe('nowrap')}
})

test('thẻ hoàn thành không có progress và thẻ đang làm vẫn có',async({page})=>{
  await page.goto('/cong-viec')
  await expect(page.locator('.task-card.is-complete').first().getByRole('progressbar')).toHaveCount(0)
  await expect(page.locator('.task-card:not(.is-complete)').filter({has:page.getByRole('progressbar')}).first()).toBeAttached()
  expect(await page.locator('.task-card.is-complete .task-title').first().evaluate(element=>getComputedStyle(element).backgroundImage)).toBe('none')
})

test('ô tháng có tối đa hai mục, +N và không có chữ trạng thái',async({page})=>{
  await page.goto('/lich')
  const cells=page.locator('.mode-month .calendar-day')
  const counts=await cells.evaluateAll(items=>items.map(cell=>cell.querySelectorAll('.calendar-task,.trip-strip').length))
  expect(Math.max(...counts)).toBeLessThanOrEqual(2)
  await expect(cells.getByText('Hoàn thành',{exact:true})).toHaveCount(0)
  await expect(cells.locator('.calendar-more').first()).toBeVisible()
})

test('ngày chọn dùng ring và giữ nền trung tính',async({page})=>{
  await page.goto('/lich')
  const selected=page.locator('.calendar-day.selected')
  const values=await selected.evaluate(element=>{const probe=document.createElement('i');probe.style.background='var(--surface)';document.body.append(probe);const result={background:getComputedStyle(element).backgroundColor,surface:getComputedStyle(probe).backgroundColor,shadow:getComputedStyle(element).boxShadow};probe.remove();return result})
  expect(values.background).toBe(values.surface)
  expect(values.shadow).not.toBe('none')
})

test('dark active nav không phủ vàng',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:'dark'}));localStorage.setItem('nhip-viec-theme','dark')})
  await page.goto('/')
  const values=await page.locator('.shell-nav-link.active').evaluate(element=>({background:getComputedStyle(element).backgroundColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),icon:getComputedStyle(element.querySelector('svg')).color}))
  expect(values.background).not.toBe(values.accent)
  expect(values.icon).toBe('rgb(251, 191, 27)')
})

test('chụp bốn màn hình U3-fix5 ở 1280x720',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Chỉ tạo ảnh chuẩn desktop')
  await page.setViewportSize({width:1280,height:720})
  await page.goto('/')
  await page.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'})
  await page.waitForTimeout(250)
  await page.screenshot({path:'docs/design/u3fix5/tong-quan-dark.png',fullPage:false})

  await page.goto('/cong-viec')
  await page.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'})
  await page.waitForTimeout(250)
  await page.screenshot({path:'docs/design/u3fix5/kanban-dark.png',fullPage:false})

  await page.goto('/lich')
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'})
  await page.waitForTimeout(250)
  await page.screenshot({path:'docs/design/u3fix5/lich-thang-light.png',fullPage:false})

  await page.goto(`/so-tay/${notebook.id}`)
  await page.screenshot({path:'docs/design/u3fix5/so-tay-list.png',fullPage:false})
})
