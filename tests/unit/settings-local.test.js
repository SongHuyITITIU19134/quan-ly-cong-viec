import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localRepo } from '@/data/localRepo'

describe('cài đặt local',()=>{
  beforeEach(()=>localStorage.clear())
  it('đọc mặc định an toàn',()=>{expect(localRepo.getSettings()).toEqual({theme:'system',defaultView:'dashboard',reportPeriod:'week'})})
  it('lưu và đọc lại đủ ba lựa chọn',async()=>{const settings={theme:'dark',defaultView:'tasks',reportPeriod:'month'},listener=vi.fn();window.addEventListener('nhip-viec-settings-change',listener,{once:true});await localRepo.saveSettings(settings);expect(localRepo.getSettings()).toEqual(settings);expect(localStorage.getItem('nhip-viec-theme')).toBe('dark');expect(listener).toHaveBeenCalledOnce()})
})
