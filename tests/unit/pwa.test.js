import { describe, expect, it, vi } from 'vitest'
import { registerPwa } from '@/lib/pwa'

describe('đăng ký PWA',()=>{
  it('bỏ qua khi không hỗ trợ service worker',async()=>expect(registerPwa(vi.fn(),{enabled:true,serviceWorker:null})).resolves.toBeNull())
  it('báo bản mới và kích hoạt worker đang chờ',async()=>{
    const postMessage=vi.fn(),onUpdate=vi.fn(),registration={waiting:{postMessage},addEventListener:vi.fn()}
    const serviceWorker={register:vi.fn().mockResolvedValue(registration)}
    await registerPwa(onUpdate,{enabled:true,serviceWorker})
    expect(serviceWorker.register).toHaveBeenCalledWith('/sw.js')
    expect(onUpdate).toHaveBeenCalledOnce()
    onUpdate.mock.calls[0][0]()
    expect(postMessage).toHaveBeenCalledWith({type:'SKIP_WAITING'})
  })
})
