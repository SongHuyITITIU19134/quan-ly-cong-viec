import { describe, expect, it } from 'vitest'
import { isReadOnlyAccount, isVerifiedAccount, REQUIRE_VERIFIED_EMAIL } from '@/auth/policy'

describe('chính sách xác minh email',()=>{
  it('bật yêu cầu xác minh',()=>expect(REQUIRE_VERIFIED_EMAIL).toBe(true))
  it('chặn email/password chưa xác minh',()=>expect(isVerifiedAccount({emailVerified:false,providerData:[{providerId:'password'}]})).toBe(false))
  it('cho email/password đã xác minh',()=>expect(isVerifiedAccount({emailVerified:true,providerData:[{providerId:'password'}]})).toBe(true))
  it('coi tài khoản Google là đã xác minh',()=>expect(isVerifiedAccount({emailVerified:false,providerData:[{providerId:'google.com'}]})).toBe(true))
  it('chỉ đặt Firebase email chưa verify ở chế độ chỉ đọc',()=>{const user={emailVerified:false,providerData:[{providerId:'password'}]};expect(isReadOnlyAccount('firebase',user)).toBe(true);expect(isReadOnlyAccount('local',user)).toBe(false);expect(isReadOnlyAccount('firebase',{...user,emailVerified:true})).toBe(false)})
})
