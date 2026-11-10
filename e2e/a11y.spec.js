import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.setTimeout(120_000)

const routes=['/','/cong-viec','/lich','/cong-tac','/danh-ba','/so-do','/so-tay','/so-tay/b1','/cai-dat','/khong-ton-tai']
const a11ySeed={projects:[],tasks:[],contacts:[{id:'self',fullName:'Tôi',isSelf:true}],trips:[],notebooks:[{id:'b1',name:'Sổ kiểm thử',color:0,pinned:false,archived:false}],notes:[]}
const loginMarkup=`<main class="login-page"><section class="card login-card" aria-labelledby="login-title"><div class="login-brand"><span aria-hidden="true">✦</span><strong>Nhịp việc</strong></div><div><span class="eyebrow">Chào mừng trở lại</span><h1 id="login-title">Đăng nhập Nhịp việc</h1><p class="muted">Dữ liệu của bạn được lưu riêng tư trên Firebase.</p></div><form class="login-form"><div class="field"><label for="audit-email">Email</label><input id="audit-email" type="email" autocomplete="email"></div><div class="field"><label for="audit-password">Mật khẩu</label><input id="audit-password" type="password" autocomplete="current-password"></div><button class="button" type="submit"><span>Đăng nhập</span></button></form><div class="login-divider"><span>hoặc</span></div><div class="login-secondary-actions"><button class="button secondary" type="button"><span>Tạo tài khoản</span></button><button class="button secondary" type="button"><span>Tiếp tục với Google</span></button></div></section></main>`

test.beforeEach(async({page})=>page.addInitScript(value=>{localStorage.setItem('nhip-viec-v1',JSON.stringify(value));localStorage.setItem('nhip-viec-notebooks',JSON.stringify(value.notebooks));localStorage.setItem('nhip-viec-notes',JSON.stringify(value.notes));localStorage.setItem('nhip-viec-initialized','true')},a11ySeed))

for(const theme of ['light','dark'])test(`axe không có lỗi nghiêm trọng ở chế độ ${theme}`,async({page})=>{
  for(const route of routes){
    await page.goto(route)
    await page.evaluate(value=>localStorage.setItem('nhip-viec-theme',value),theme)
    await page.reload()
    await expect(page.locator('.page')).toBeVisible()
    await page.waitForTimeout(700)
    const results=await new AxeBuilder({page}).options({resultTypes:['violations']}).analyze()
    expect(results.violations.filter(item=>['critical','serious'].includes(item.impact)),`${route}: ${results.violations.map(item=>item.id).join(', ')}`).toEqual([])
  }
  await page.goto('/')
  await page.evaluate(({markup,value})=>{localStorage.setItem('nhip-viec-theme',value);document.documentElement.dataset.theme=value;document.querySelector('#root').innerHTML=markup},{markup:loginMarkup,value:theme})
  await page.waitForTimeout(400)
  const results=await new AxeBuilder({page}).options({resultTypes:['violations']}).analyze()
  expect(results.violations.filter(item=>['critical','serious'].includes(item.impact)),`login: ${results.violations.map(item=>item.id).join(', ')}`).toEqual([])
})

test('command palette không có lỗi axe nghiêm trọng',async({page})=>{await page.goto('/');await expect(page.locator('.page')).toBeVisible();await page.keyboard.press('ControlOrMeta+k');await expect(page.getByRole('dialog',{name:'Bảng lệnh'})).toBeVisible();const results=await new AxeBuilder({page}).analyze();expect(results.violations.filter(item=>['critical','serious'].includes(item.impact))).toEqual([])})

test('luồng bàn phím chính giữ focus và thao tác được',async({page})=>{
  await page.goto('/')
  const nav=page.getByRole('navigation',{name:'Điều hướng chính'})
  await nav.getByRole('link',{name:'Công việc'}).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading',{name:'Công việc'})).toBeFocused()
  await page.keyboard.press('n')
  const dialog=page.getByRole('dialog',{name:'Tạo nhiệm vụ'})
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.keyboard.press('n')
  await page.getByLabel('Tên nhiệm vụ *').fill('Kiểm thử bàn phím')
  await page.getByRole('button',{name:'Lưu thay đổi'}).click()
  const menu=page.getByRole('button',{name:'Tùy chọn cho Kiểm thử bàn phím'})
  await menu.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('menuitem',{name:'Hoàn thành'}).click()
  await expect(page.locator('#main-content [aria-live="polite"]')).toHaveText('Đã chuyển Kiểm thử bàn phím sang Hoàn thành.')
})
