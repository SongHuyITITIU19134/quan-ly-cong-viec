import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const config = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'))
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]))

describe('Vercel security headers', () => {
  it('bật các header phòng vệ cơ bản', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['Permissions-Policy']).toContain('camera=()')
    expect(headers['X-Frame-Options']).toBe('DENY')
  })

  it('giữ CSP ở chế độ report-only và cho phép dịch vụ Firebase Auth', () => {
    expect(headers['Content-Security-Policy']).toBeUndefined()
    const csp = headers['Content-Security-Policy-Report-Only']
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain('https://*.googleapis.com')
    expect(csp).toContain('https://accounts.google.com')
    expect(csp).toContain('https://recaptcha.google.com')
  })
})
