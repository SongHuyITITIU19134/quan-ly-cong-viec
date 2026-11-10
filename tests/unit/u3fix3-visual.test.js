import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read=file=>readFileSync(resolve(file),'utf8')
const styles=readdirSync(resolve('src/styles')).filter(file=>file.endsWith('.css')).map(file=>read(`src/styles/${file}`)).join('\n')

describe('U3-fix3 visual polish',()=>{
  it('định nghĩa đúng type scale và không còn cỡ chữ dưới 13px',()=>{
    const tokens=read('src/styles/tokens.css')
    expect(tokens).toMatch(/--fs-xs:\s*13px/)
    expect(tokens).toMatch(/--fs-sm:\s*14px/)
    expect(tokens).toMatch(/--fs-base:\s*16px/)
    expect(tokens).toMatch(/--fs-md:\s*17px/)
    expect(tokens).toMatch(/--fs-lg:\s*20px/)
    expect(tokens).toMatch(/--fs-xl:\s*24px/)
    expect(styles).not.toMatch(/font-size\s*:\s*(?:[0-9]|1[0-2])px|font-size\s*:\s*0(?:[;}])/)
  })

  it('dark active nav dùng nền vàng và chữ đen',()=>{
    expect(read('src/styles/shell.css')).toMatch(/\[data-theme='dark'\] \.shell-nav-link\.active\s*\{[^}]*background:\s*var\(--accent\);[^}]*color:\s*var\(--on-accent\)/)
  })

  it('dark emphasis dùng nền đen và viền #3a3a40',()=>{
    const dashboard=read('src/styles/dashboard.css')
    expect(dashboard).toMatch(/\[data-theme='dark'\][^{]+is-emphasis[^}]*border:\s*1px solid #3a3a40;[^}]*background:\s*#000/)
    expect(read('src/styles/tasks.css')).toMatch(/\[data-theme='dark'\] \.task-card\.is-emphasis\s*\{[^}]*border:\s*1px solid #3a3a40;[^}]*background:\s*#000/)
  })
})
