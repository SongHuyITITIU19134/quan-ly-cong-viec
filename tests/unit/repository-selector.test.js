import { describe, expect, it, vi } from 'vitest'
import { selectDataMode } from '@/data/repository'

describe('chọn kho dữ liệu',()=>{
  it('chọn Firebase khi đủ mode, API key và project ID',()=>{const warn=vi.fn();expect(selectDataMode({VITE_DATA_MODE:'firebase',VITE_FIREBASE_API_KEY:'key',VITE_FIREBASE_PROJECT_ID:'project'},warn)).toBe('firebase');expect(warn).not.toHaveBeenCalled()})
  it('thiếu API key thì fallback local và chỉ nêu tên biến',()=>{const warn=vi.fn();expect(selectDataMode({VITE_DATA_MODE:'firebase',VITE_FIREBASE_PROJECT_ID:'project'},warn)).toBe('local');expect(warn).toHaveBeenCalledWith(expect.stringContaining('VITE_FIREBASE_API_KEY'));expect(warn.mock.calls[0][0]).not.toContain('project')})
  it('thiếu project ID thì fallback local',()=>{const warn=vi.fn();expect(selectDataMode({VITE_DATA_MODE:'firebase',VITE_FIREBASE_API_KEY:'key'},warn)).toBe('local');expect(warn).toHaveBeenCalledWith(expect.stringContaining('VITE_FIREBASE_PROJECT_ID'))})
  it('thiếu mode thì fallback local và báo đủ tên biến thiếu',()=>{const warn=vi.fn();expect(selectDataMode({},warn)).toBe('local');expect(warn.mock.calls[0][0]).toContain('VITE_DATA_MODE');expect(warn.mock.calls[0][0]).toContain('VITE_FIREBASE_API_KEY');expect(warn.mock.calls[0][0]).toContain('VITE_FIREBASE_PROJECT_ID')})
})
