import { useEffect } from 'react'
import { repository, dataMode } from '@/data/repository'
import { isVerifiedAccount, REQUIRE_VERIFIED_EMAIL } from '@/auth/policy'

const emptyData={projects:[],tasks:[],contacts:[],trips:[],notebooks:[],notes:[]}

export function useRepositoryConnection({
  toast,setData,setLoading,setError,setUser,setAuthPending,setAuthError,setAuthNotice,
  setVerificationCheck,setImportOffer,setTagRegistry,setSettings,
}){
  useEffect(()=>{
    let unsubscribe=()=>{}
    let unsubscribeTags=()=>{}
    let unsubscribeAuth=()=>{}
    let active=true
    let generation=0
    const fail=err=>{
      if(!active)return
      setLoading(false)
      setError('Không thể đồng bộ dữ liệu. Vui lòng thử lại.')
      toast(`Lỗi đồng bộ: ${err?.message||'Không xác định'}`)
    }
    const connectLocal=async()=>{
      try{
        if(repository.getSettings)setSettings(await repository.getSettings())
        unsubscribe=repository.subscribe('*',next=>{
          setData(next)
          setLoading(false)
          setError(null)
        },err=>{
          setLoading(false)
          setError('Không thể đồng bộ dữ liệu. Vui lòng thử lại.')
          toast(`Lỗi đồng bộ: ${err?.message||'Không xác định'}`)
        })
        unsubscribeTags=repository.subscribeTagColors(setTagRegistry)
      }catch(err){
        setLoading(false)
        setError('Không thể khởi tạo kho dữ liệu.')
        toast(`Lỗi dữ liệu: ${err?.message||'Không xác định'}`)
      }
    }
    const connectFirebase=async()=>{
      try{
        const{observeAuth}=await import('@/data/firebase')
        if(!active)return
        unsubscribeAuth=observeAuth(async nextUser=>{
          const current=++generation
          unsubscribe()
          unsubscribeTags()
          unsubscribe=()=>{}
          unsubscribeTags=()=>{}
          setData(emptyData)
          setUser(nextUser)
          setAuthPending(false)
          setAuthError(null)
          setAuthNotice(null)
          setVerificationCheck(value=>value+1)
          setImportOffer(false)
          setError(null)
          setTagRegistry({c:{}})
          if(!nextUser){setLoading(false);return}
          setLoading(true)
          try{
            const verified=!REQUIRE_VERIFIED_EMAIL||isVerifiedAccount(nextUser)
            if(verified){
              await repository.ensureUserProfile(nextUser)
              await repository.prepareUserData(nextUser.uid)
              if(repository.getSettings)setSettings(await repository.getSettings(nextUser.uid))
            }
            if(!active||current!==generation)return
            unsubscribe=repository.subscribe('*',next=>{
              if(active&&current===generation){
                setData(next)
                setLoading(false)
                setError(null)
              }
            },err=>{
              if(active&&current===generation)fail(err)
            },nextUser.uid)
            unsubscribeTags=repository.subscribeTagColors(next=>{
              if(active&&current===generation)setTagRegistry(next)
            },err=>{
              if(active&&current===generation)fail(err)
            },nextUser.uid)
            setImportOffer(verified&&repository.getLocalImportOffer(nextUser.uid))
          }catch(err){
            if(active&&current===generation)fail(err)
          }
        },async err=>{
          const{authErrorMessage}=await import('@/data/firebase')
          setAuthPending(false)
          setAuthError(authErrorMessage(err))
          fail(err)
        })
      }catch(err){
        setAuthPending(false)
        setAuthError('Không thể khởi tạo đăng nhập Firebase.')
        fail(err)
      }
    }
    if(dataMode==='firebase')connectFirebase()
    else connectLocal()
    return()=>{
      active=false
      generation+=1
      unsubscribeAuth()
      unsubscribe()
      unsubscribeTags()
    }
  },[toast,setData,setLoading,setError,setUser,setAuthPending,setAuthError,setAuthNotice,
    setVerificationCheck,setImportOffer,setTagRegistry,setSettings])
}
