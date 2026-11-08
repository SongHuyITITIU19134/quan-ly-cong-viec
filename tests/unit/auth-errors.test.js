import { describe, expect, it, vi } from 'vitest'
import { authErrorMessage } from '@/auth/errors'

describe('thông báo lỗi xác thực',()=>{
  it.each([
    ['auth/email-already-in-use','Email này đã được sử dụng.'],
    ['auth/invalid-credential','Email hoặc mật khẩu không đúng.'],
    ['auth/too-many-requests','Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.'],
    ['app-check/recaptcha-error','Không thể xác minh bảo mật ứng dụng. Vui lòng tải lại trang.'],
  ])('%s', (code,message)=>{vi.spyOn(console,'error').mockImplementation(()=>{});expect(authErrorMessage({code})).toBe(message);expect(console.error).toHaveBeenCalledWith('[Firebase Auth]',code);vi.restoreAllMocks()})
})
