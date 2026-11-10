import { useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { repository, dataMode } from '@/data/repository'
import { buildCatalog } from '@/tags/tagUtils'
import { isReadOnlyAccount, isVerifiedAccount, REQUIRE_VERIFIED_EMAIL } from '@/auth/policy'
import { DataContext } from '@/contexts/DataContext'
import { ActionsContext } from '@/contexts/ActionsContext'
import { AuthContext } from '@/contexts/AuthContext'
import { ToastContext } from '@/contexts/ToastContext'
import ToastProvider from '@/contexts/ToastProvider'
import { vi } from '@/i18n/vi'
import { useRepositoryConnection } from './useRepositoryConnection'
const initialData = {
  projects: [],
  tasks: [],
  contacts: [],
  trips: [],
  notebooks: [],
  notes: []
}
const initialSettings = {
  theme: 'system',
  defaultView: 'dashboard',
  reportPeriod: 'week',
  onboardingSeen: false
}
function CoreDataProvider({
  children
}) {
  const toastStore = useContext(ToastContext),
    toast = toastStore.toast
  const [data, setData] = useState(initialData),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null)
  const [user, setUser] = useState(null),
    [authPending, setAuthPending] = useState(dataMode === 'firebase'),
    [authBusy, setAuthBusy] = useState(false),
    [authError, setAuthError] = useState(null),
    [authNotice, setAuthNotice] = useState(null)
  const [verificationCheck, setVerificationCheck] = useState(0),
    [importOffer, setImportOffer] = useState(false),
    [importBusy, setImportBusy] = useState(false)
  const [tagRegistry, setTagRegistry] = useState({
      c: {}
    }),
    [settings, setSettings] = useState(initialSettings)
  const live = useRef({
    data,
    tagRegistry,
    user,
    readOnly: false
  })
  live.current = {
    data,
    tagRegistry,
    user,
    readOnly: isReadOnlyAccount(dataMode, user)
  }
  useRepositoryConnection({
    toast,setData,setLoading,setError,setUser,setAuthPending,setAuthError,setAuthNotice,
    setVerificationCheck,setImportOffer,setTagRegistry,setSettings,
  })
  const run = useCallback(async operation => {
    try {
      const result = await operation()
      setError(null)
      return result ?? true
    } catch (err) {
      setError(vi.feedback.saveError)
      toast(vi.feedback.saveFailed(err?.code,err?.message))
      return null
    }
  }, [toast])
  const mutate = useCallback(operation => {
    if (live.current.readOnly) {
      toast(vi.auth.verifyToEdit)
      return Promise.resolve(null)
    }
    return run(operation)
  }, [run, toast])
  const create = useCallback((collection, item) => mutate(() => repository.create(collection, item)), [mutate])
  const update = useCallback((collection, id, patch) => mutate(() => repository.update(collection, id, patch)), [mutate])
  const remove = useCallback((collection, id) => mutate(() => repository.remove(collection, id)), [mutate])
  const batch=useCallback(ops=>mutate(()=>repository.batch(
    ops,
    live.current.tagRegistry,
    [...live.current.data.tasks,...live.current.data.notes],
  )),[mutate])
  const reset = useCallback(() => mutate(() => repository.reset?.()), [mutate])
  const saveSettings = useCallback(next => mutate(async () => {
    const saved = await repository.saveSettings(next, live.current.user?.uid)
    setSettings(saved)
    return saved
  }), [mutate])
  const saveTaskTags = useCallback((taskId, tags) => mutate(() => repository.saveTaskTags(taskId, tags, live.current.tagRegistry)), [mutate])
  const manageTags = useCallback((updates, registry) => mutate(() => repository.manageTags(updates, registry)), [mutate])
  const authAction = useCallback(async action => {
    try {
      setAuthBusy(true)
      setAuthError(null)
      setAuthNotice(null)
      await action()
      return true
    } catch (err) {
      const {
        authErrorMessage
      } = await import('@/data/firebase')
      setAuthError(authErrorMessage(err))
      return false
    } finally {
      setAuthBusy(false)
    }
  }, [])
  const login = useCallback(() => authAction(async () => {
    const {
      signInWithGoogle
    } = await import('@/data/firebase')
    await signInWithGoogle()
  }), [authAction])
  const loginEmail = useCallback((email, password) => authAction(async () => {
    const {
      signInWithEmail
    } = await import('@/data/firebase')
    await signInWithEmail(email, password)
  }), [authAction])
  const registerEmail = useCallback((displayName, email, password) => authAction(async () => {
    const {
      registerWithEmail
    } = await import('@/data/firebase')
    await registerWithEmail(displayName, email, password)
  }), [authAction])
  const resetPassword = useCallback(async email => {
    try {
      setAuthBusy(true)
      setAuthError(null)
      const {
        requestPasswordReset
      } = await import('@/data/firebase')
      await requestPasswordReset(email)
    } catch (err) {
      const {
        authErrorMessage
      } = await import('@/data/firebase')
      authErrorMessage(err)
    } finally {
      setAuthBusy(false)
      setAuthNotice('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.')
    }
    return true
  }, [])
  const logout = useCallback(async () => {
    try {
      const {
        signOutUser
      } = await import('@/data/firebase')
      await signOutUser()
    } catch (err) {
      const {
        authErrorMessage
      } = await import('@/data/firebase')
      toast(authErrorMessage(err))
    }
  }, [toast])
  const resendEmail = useCallback(async () => {
    try {
      const {
        resendVerification
      } = await import('@/data/firebase')
      await resendVerification(live.current.user)
      toast('Đã gửi lại email xác minh.')
    } catch (err) {
      const {
        authErrorMessage
      } = await import('@/data/firebase')
      toast(authErrorMessage(err))
    }
  }, [toast])
  const confirmEmail = useCallback(async () => {
    try {
      const {
        refreshVerification
      } = await import('@/data/firebase')
      const refreshed = await refreshVerification(live.current.user)
      setUser(refreshed)
      setVerificationCheck(value => value + 1)
      if (isVerifiedAccount(refreshed)) {
        await repository.ensureUserProfile(refreshed)
        await repository.prepareUserData(refreshed.uid)
        setImportOffer(repository.getLocalImportOffer(refreshed.uid))
        toast('Email đã được xác minh.')
      } else toast('Email chưa được xác minh. Vui lòng thử lại sau.')
    } catch (err) {
      const {
        authErrorMessage
      } = await import('@/data/firebase')
      toast(authErrorMessage(err))
    }
  }, [toast])
  const importLocal = useCallback(async () => {
    const currentUser = live.current.user
    if (!currentUser) return
    try {
      setImportBusy(true)
      const result = await repository.importLocalData(currentUser.uid)
      setImportOffer(false)
      toast(`Đã nhập ${result.imported} mục, bỏ qua ${result.skipped} mục đã có, ${result.invalid} mục không hợp lệ.`)
    } catch (err) {
      toast(`Không thể nhập dữ liệu: ${err?.message || 'Vui lòng thử lại.'}`)
    } finally {
      setImportBusy(false)
    }
  }, [toast])
  const skipImport = useCallback(() => {
    if (live.current.user) repository.skipLocalImport(live.current.user.uid)
    setImportOffer(false)
  }, [])
  const tagCatalog = useMemo(() => buildCatalog([...data.tasks, ...data.notes], tagRegistry), [data.tasks, data.notes, tagRegistry])
  const dataValue = useMemo(() => ({
    data,
    loading,
    error,
    setError,
    mode: dataMode,
    tagCatalog,
    tagRegistry,
    settings
  }), [data, loading, error, tagCatalog, tagRegistry, settings])
  const actionsValue = useMemo(() => ({
    create,
    update,
    remove,
    batch,
    reset,
    saveSettings,
    saveTaskTags,
    manageTags
  }), [create, update, remove, batch, reset, saveSettings, saveTaskTags, manageTags])
  const readOnly = isReadOnlyAccount(dataMode, user)
  const authValue = useMemo(() => ({
    user,
    authPending,
    authBusy,
    authError,
    authNotice,
    login,
    loginEmail,
    registerEmail,
    resetPassword,
    logout,
    readOnly,
    emailNeedsVerification: Boolean(REQUIRE_VERIFIED_EMAIL && user && !isVerifiedAccount(user)),
    resendEmail,
    confirmEmail,
    importOffer,
    importBusy,
    importLocal,
    skipImport
  }),[
    user,authPending,authBusy,authError,authNotice,login,loginEmail,registerEmail,resetPassword,
    logout,readOnly,verificationCheck,resendEmail,confirmEmail,importOffer,importBusy,importLocal,skipImport,
  ])
  return <DataContext.Provider value={dataValue}>
    <ActionsContext.Provider value={actionsValue}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </ActionsContext.Provider>
  </DataContext.Provider>
}
export function DataProvider({
  children
}) {
  return <ToastProvider><CoreDataProvider>{children}</CoreDataProvider></ToastProvider>
}
export const useDataState = () => useContext(DataContext)
export const useActions = () => useContext(ActionsContext)
export const useAuth = () => useContext(AuthContext)
export const useToast = () => useContext(ToastContext).toast
export function useData() {
  const data = useContext(DataContext),
    actions = useContext(ActionsContext),
    auth = useContext(AuthContext),
    toast = useContext(ToastContext)
  return useMemo(() => ({
    ...data,
    ...actions,
    ...auth,
    toast: toast.toast
  }), [data, actions, auth, toast])
}
export function useToasts() {
  const store = useContext(ToastContext),
    toasts = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return {
    toasts,
    dismiss: store.dismiss,
    pauseToast: store.pauseToast,
    resumeToast: store.resumeToast
  }
}
