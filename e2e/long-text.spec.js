import { test, expect } from '@playwright/test'

test.setTimeout(90_000)

test('chữ dài: giới hạn nhập, Kanban, chi tiết và biểu đồ',async({page})=>{
 const spaced=('Hoàn thiện báo cáo quy hoạch quý bốn ').repeat(4).slice(0,120)
 const unbroken='A'.repeat(60)
 const vietnamese='Hoàn thiện số liệu báo cáo quy hoạch phục vụ họp thẩm định cấp tỉnh quý 4'
 const projectName='Báo cáo quy hoạch phục vụ họp thẩm định cấp tỉnh Q4!!'
 await page.goto('/cong-viec')
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('nhip-viec-initialized','true');localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true}))});await page.reload()
 await page.getByRole('tab',{name:'Dự án'}).click()
 await page.getByRole('button',{name:'Tạo dự án',exact:true}).first().click()
 await page.getByLabel('Tên dự án *').fill(projectName)
 await expect(page.getByLabel('Tên dự án *')).toHaveAttribute('maxlength','60')
 await page.getByRole('button',{name:'Lưu dự án',exact:true}).click()
 await page.getByRole('tab',{name:'Kanban',exact:true}).click()
 for(const title of [spaced,unbroken,vietnamese]){
  await page.keyboard.press('n')
  const input=page.getByLabel('Tên nhiệm vụ *')
  if(title===spaced){await input.fill('B'.repeat(125));await expect(input).toHaveValue('B'.repeat(120));const counter=page.getByText('120/120',{exact:true});await expect(counter).toHaveClass(/text-danger/);const rgb=await counter.evaluate(el=>getComputedStyle(el).color.match(/\d+/g).map(Number));expect(rgb[0]).toBeGreaterThan(rgb[1])}
  await input.fill(title)
  await page.getByText('Liên kết',{exact:true}).click()
  await page.getByLabel('Dự án',{exact:true}).selectOption({label:projectName})
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click()
 }
 for(const title of [spaced,unbroken,vietnamese]){
  const card=page.locator('.task-card').filter({has:page.getByRole('button',{name:title,exact:true})})
  await card.scrollIntoViewIfNeeded()
  await expect(card.locator('.task-title')).toHaveAttribute('title',title)
  const dimensions=await card.evaluate(el=>{
   const r=el.getBoundingClientRect(),column=el.closest('.kanban-column'),c=column.getBoundingClientRect(),s=getComputedStyle(column),menu=el.querySelector('.task-menu .popover-trigger').getBoundingClientRect(),badge=el.querySelector('.task-card-top .badge').getBoundingClientRect(),title=el.querySelector('.task-title'),t=getComputedStyle(title)
   return {width:r.width,available:c.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth),overflow:el.scrollWidth>el.clientWidth+1,menu:[menu.width,menu.height],aligned:Math.abs(menu.y+menu.height/2-badge.y-badge.height/2)<2,clamp:t.webkitLineClamp,titleHeight:title.clientHeight,lineHeight:parseFloat(t.lineHeight),padding:parseFloat(t.paddingTop)+parseFloat(t.paddingBottom)}
  })
  expect(dimensions.overflow).toBe(false);expect(Math.abs(dimensions.width-dimensions.available)).toBeLessThan(2);expect(dimensions.menu).toEqual([32,32]);expect(dimensions.aligned).toBe(true);expect(dimensions.clamp).toBe('2');expect(dimensions.titleHeight).toBeLessThanOrEqual(dimensions.lineHeight*2+dimensions.padding+1)
  await expect(card.locator('.project-line')).toHaveAttribute('title',projectName)
  await card.locator('.task-title').click()
  await expect(page.locator('.task-full-title')).toHaveText(title)
  expect(await page.locator('.task-full-title').evaluate(el=>getComputedStyle(el).webkitLineClamp)).toBe('none')
  await page.getByRole('dialog').getByRole('button',{name:'Đóng',exact:true}).click()
  await expect(page.getByRole('dialog')).toBeHidden()
 }
 await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('nhip-viec-v1')),names=['Báo cáo quy hoạch phục vụ họp thẩm định cấp tỉnh quý 4','Triển khai hệ thống quản lý vận tải và kho hàng ABC','Công việc hành chính và tổng hợp báo cáo định kỳ'],project=data.projects[0],tasks=data.tasks;data.projects=names.map((name,index)=>({...project,id:`layout-p${index}`,name}));data.tasks=Array.from({length:13},(_,index)=>({...tasks[index%tasks.length],id:`layout-t${index}`,title:index<tasks.length?tasks[index].title:`Nhiệm vụ bố cục ${index+1}`,projectId:data.projects[index<5?0:index<10?1:2].id,status:'todo',order:index+1}));localStorage.setItem('nhip-viec-v1',JSON.stringify(data))})
 await page.reload()
 const column=page.locator('.kanban-column').first();await column.getByRole('button',{name:/Xem thêm \d+ việc/u}).click();expect(await column.locator('.task-card').count()).toBeGreaterThan(6)
 await column.locator('.task-card').last().scrollIntoViewIfNeeded();await expect(column.locator('.task-card').last()).toBeInViewport()
 await page.goto('/')
 await page.getByRole('button',{name:'Bảng tiếp theo'}).click()
 const chart=page.locator('.mini-bars');await chart.scrollIntoViewIfNeeded()
 await expect(chart.locator('.mini-bar-item strong')).toHaveText(['5','5','3'])
 const values=await chart.locator('.mini-bar-item').evaluateAll(items=>items.map(el=>{const label=el.querySelector('small'),s=getComputedStyle(label);return {full:label.textContent===label.title,clamp:s.webkitLineClamp,height:label.clientHeight,lineHeight:parseFloat(s.lineHeight),overflow:el.scrollWidth>el.clientWidth+1}}))
 for(const value of values){expect(value.full).toBe(true);expect(value.clamp).toBe('2');expect(value.height).toBeLessThanOrEqual(value.lineHeight*2+1);expect(value.overflow).toBe(false)}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
