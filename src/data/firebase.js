import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { browserLocalPersistence, createUserWithEmailAndPassword, getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, updateProfile } from 'firebase/auth'
import { authErrorMessage } from '@/auth/errors'
import { isVerifiedAccount } from '@/auth/policy'
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID}
export const firebaseConfigured=Boolean(config.apiKey&&config.projectId)
export const firebaseApp=firebaseConfigured?initializeApp(config):null
const appCheckKey=import.meta.env.VITE_RECAPTCHA_SITE_KEY
if(firebaseApp&&appCheckKey&&import.meta.env.DEV&&import.meta.env.VITE_APPCHECK_DEBUG==='true'&&typeof self!=='undefined')self.FIREBASE_APPCHECK_DEBUG_TOKEN=true
export const appCheck=firebaseApp&&appCheckKey?initializeAppCheck(firebaseApp,{provider:new ReCaptchaV3Provider(appCheckKey),isTokenAutoRefreshEnabled:true}):null
if(firebaseApp&&!appCheckKey)console.warn('[Firebase App Check] Thiếu biến VITE_RECAPTCHA_SITE_KEY; App Check đã được bỏ qua.')
export const firestore=firebaseApp?initializeFirestore(firebaseApp,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})}):null
export const auth=firebaseApp?getAuth(firebaseApp):null
export const authPersistenceReady=auth?setPersistence(auth,browserLocalPersistence):Promise.resolve()

const mobileDevice=()=>typeof window!=='undefined'&&(window.matchMedia?.('(pointer: coarse)').matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
export function observeAuth(callback,onError){
  let active=true,unsubscribe=()=>{}
  authPersistenceReady.then(()=>getRedirectResult(auth)).then(()=>{if(active)unsubscribe=onAuthStateChanged(auth,callback,onError)}).catch(onError)
  return()=>{active=false;unsubscribe()}
}
export async function signInWithGoogle(){
  await authPersistenceReady
  const provider=new GoogleAuthProvider()
  provider.setCustomParameters({prompt:'select_account'})
  if(mobileDevice())return signInWithRedirect(auth,provider)
  try{return await signInWithPopup(auth,provider)}
  catch(error){if(error?.code==='auth/popup-blocked')return signInWithRedirect(auth,provider);throw error}
}
export async function signOutUser(){await authPersistenceReady;return signOut(auth)}
export async function signInWithEmail(email,password){await authPersistenceReady;return signInWithEmailAndPassword(auth,email,password)}
export async function registerWithEmail(displayName,email,password){await authPersistenceReady;const credential=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(credential.user,{displayName});await sendEmailVerification(credential.user);return credential}
export async function requestPasswordReset(email){await authPersistenceReady;return sendPasswordResetEmail(auth,email)}
export async function resendVerification(user=auth?.currentUser){if(user&&!user.emailVerified)return sendEmailVerification(user)}
export async function refreshVerification(user=auth?.currentUser){if(!user)return null;await user.reload();await user.getIdToken(true);return auth?.currentUser||user}
export const isVerifiedUser=isVerifiedAccount
export { authErrorMessage }
