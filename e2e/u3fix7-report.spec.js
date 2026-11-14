import { test, expect } from '@playwright/test'
import { spawn } from 'node:child_process'
import { makeDemoData } from '../scripts/make-demo-data.mjs'

const demo = makeDemoData().data
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const data = { ...demo, tasks: demo.tasks.map((task, index) => ({ ...task, status: index < 5 ? 'doing' : task.status,
  dueDate: index < 5 ? today : task.dueDate })) }
let server

test.beforeAll(async ({ browser }, testInfo) => {
  if (!browser.isConnected()) throw new Error('Browser unavailable')
  if (testInfo.project.name !== 'desktop-1280') return
  server = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], {
    cwd: process.cwd(), env: { ...process.env, VITE_DATA_MODE: 'local', VITE_E2E: 'false' }, stdio: 'ignore'
  })
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch('http://127.0.0.1:4174/')).ok) return } catch { /* server is starting */ }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('Local report server did not start')
})

test.afterAll(() => { server?.kill() })

async function openReport(page, width, theme = 'light') {
  await page.setViewportSize({ width, height: width === 1280 ? 720 : 800 })
  await page.addInitScript(({ value, selectedTheme }) => {
    localStorage.setItem('nhip-viec-v1', JSON.stringify(value))
    localStorage.setItem('nhip-viec-initialized', 'true')
    localStorage.setItem('nhip-viec-settings', JSON.stringify({ onboardingSeen: true, theme: selectedTheme }))
    localStorage.setItem('nhip-viec-theme', selectedTheme)
  }, { value: data, selectedTheme: theme })
  await page.goto('http://127.0.0.1:4174/')
  return page.getByRole('dialog', { name: /Báo cáo công việc/ })
}

for (const [width, theme] of [[1280, 'light'], [768, 'light'], [390, 'light'], [1280, 'dark']])
  test(`modal báo cáo không tràn ngang ở ${width}px ${theme}, KPI và ghi chú đầy đủ`, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280')
  const dialog = await openReport(page, width, theme)
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.daily-kpi')).toHaveCount(5)
  const dimensions = await dialog.evaluate(modal => {
    const body = modal.querySelector('.modal-body'), note = modal.querySelector('.daily-briefing-note'), footer = modal.querySelector('.modal-actions')
    return { body: body.scrollWidth <= body.clientWidth, note: note.scrollWidth <= note.clientWidth,
      footer: footer.scrollWidth <= footer.clientWidth, modal: modal.getBoundingClientRect().width <= innerWidth,
      tiles: [...modal.querySelectorAll('.daily-kpi')].every(tile => Boolean(tile.querySelector('strong')?.textContent)) }
  })
  expect(dimensions).toEqual({ body: true, note: true, footer: true, modal: true, tiles: true })
  if (theme === 'light' && width !== 768) {
    await page.addStyleTag({ content: '.toast-stack { display: none !important; }' })
    await page.waitForTimeout(400)
    await page.screenshot({ path: `docs/design/u3fix7/report-${width}.png`, fullPage: false })
  }
})
