import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DataProvider, useData } from '@/hooks/useData'

const mocks=vi.hoisted(()=>({user:null,refreshed:null,ensure:vi.fn(),prepare:vi.fn(),offer:vi.fn(),subscribe:vi.fn(),subscribeTags:vi.fn()}))
vi.mock('@/data/repository',()=>({
  dataMode:'firebase',
  repository:{
    ensureUserProfile:mocks.ensure,
    prepareUserData:mocks.prepare,
    getLocalImportOffer:mocks.offer,
    subscribe:mocks.subscribe,
    subscribeTagColors:mocks.subscribeTags,
  },
}))
vi.mock('@/data/firebase',()=>({
  observeAuth:callback=>{callback(mocks.user);return()=>{}},
  refreshVerification:vi.fn(()=>Promise.resolve(mocks.refreshed)),
  authErrorMessage:()=> 'Lỗi xác thực',
}))

function Harness(){const value=useData();return <><span data-testid="verification">{String(value.emailNeedsVerification)}</span>{value.error&&<div role="alert">{value.error}</div>}<button onClick={value.confirmEmail}>Tôi đã xác minh</button></>}
const mount=()=>render(<DataProvider><Harness/></DataProvider>)

describe('luồng xác minh trước khi ghi tự động',()=>{
  beforeEach(()=>{mocks.ensure.mockReset().mockResolvedValue();mocks.prepare.mockReset().mockResolvedValue(false);mocks.offer.mockReset().mockReturnValue(false);mocks.subscribe.mockReset().mockImplementation((_name,callback)=>{callback({projects:[],tasks:[],contacts:[],trips:[],notebooks:[],notes:[]});return()=>{}});mocks.subscribeTags.mockReset().mockImplementation(callback=>{callback({c:{}});return()=>{}})})
  it('email/password chưa verify chỉ đọc, không ghi và không báo lỗi',async()=>{mocks.user={uid:'u1',emailVerified:false,providerData:[{providerId:'password'}]};mount();await waitFor(()=>expect(screen.getByTestId('verification')).toHaveTextContent('true'));expect(mocks.ensure).not.toHaveBeenCalled();expect(mocks.prepare).not.toHaveBeenCalled();expect(mocks.offer).not.toHaveBeenCalled();expect(screen.queryByRole('alert')).not.toBeInTheDocument()})
  it('Google có email_verified chạy đủ flow tự động',async()=>{mocks.user={uid:'g1',emailVerified:true,providerData:[{providerId:'google.com'}]};mount();await waitFor(()=>expect(mocks.ensure).toHaveBeenCalledWith(mocks.user));expect(mocks.prepare).toHaveBeenCalledWith('g1');expect(mocks.offer).toHaveBeenCalledWith('g1');expect(screen.getByTestId('verification')).toHaveTextContent('false')})
  it('chỉ chạy ghi tự động sau nút xác minh trả về user đã verify',async()=>{mocks.user={uid:'u1',emailVerified:false,providerData:[{providerId:'password'}]};mocks.refreshed={...mocks.user,emailVerified:true};mount();await waitFor(()=>expect(screen.getByTestId('verification')).toHaveTextContent('true'));await userEvent.click(screen.getByRole('button',{name:'Tôi đã xác minh'}));await waitFor(()=>expect(mocks.ensure).toHaveBeenCalledWith(mocks.refreshed));expect(mocks.prepare).toHaveBeenCalledWith('u1');expect(mocks.offer).toHaveBeenCalledWith('u1');expect(screen.getByTestId('verification')).toHaveTextContent('false')})
})
