import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useData } from '@/hooks/useData'
import { vi } from '@/i18n/vi'
import { validateAuthForm } from '@/auth/validation'

const empty={displayName:'',email:'',password:'',confirmPassword:''}
export default function Login(){
  const{login,loginEmail,registerEmail,resetPassword,authBusy,authError,authNotice}=useData()
  const[mode,setMode]=useState('login'),[values,setValues]=useState(empty),[errors,setErrors]=useState({}),[showPassword,setShowPassword]=useState(false),[cooldown,setCooldown]=useState(false)
  const timer=useRef()
  useEffect(()=>()=>window.clearTimeout(timer.current),[])
  const change=event=>{setValues(current=>({...current,[event.target.name]:event.target.value}));setErrors(current=>({...current,[event.target.name]:''}))}
  const startCooldown=()=>{setCooldown(true);timer.current=window.setTimeout(()=>setCooldown(false),3000)}
  const submit=async event=>{event.preventDefault();const next=validateAuthForm(mode,values);setErrors(next);if(Object.keys(next).length)return;const ok=mode==='register'?await registerEmail(values.displayName.trim(),values.email.trim(),values.password):await loginEmail(values.email.trim(),values.password);if(!ok)startCooldown()}
  const forgot=async()=>{const emailError=validateAuthForm('login',{...values,password:'12345678'}).email;if(emailError){setErrors(current=>({...current,email:emailError}));return}await resetPassword(values.email.trim())}
  const switchMode=next=>{setMode(next);setErrors({});setValues(empty);setShowPassword(false)}
  return <main className="login-page">
    <Card className="login-card">
      <div className="login-brand"><span><Sparkles size={24}/></span><strong>{vi.appName}</strong></div>
      <div><span className="eyebrow">{vi.auth.welcome}</span><h1>{vi.auth.title}</h1><p className="muted">{vi.auth.description}</p></div>
      <div className="login-tabs" role="tablist" aria-label="Chọn hình thức xác thực"><button type="button" role="tab" aria-selected={mode==='login'} onClick={()=>switchMode('login')}>{vi.auth.loginTab}</button><button type="button" role="tab" aria-selected={mode==='register'} onClick={()=>switchMode('register')}>{vi.auth.registerTab}</button></div>
      <form className="login-form" onSubmit={submit} noValidate>
        {mode==='register'&&<div className="field"><label htmlFor="auth-name">Họ tên</label><input id="auth-name" name="displayName" autoComplete="name" value={values.displayName} onChange={change} aria-invalid={Boolean(errors.displayName)} aria-describedby={errors.displayName?'auth-name-error':undefined}/>{errors.displayName&&<span id="auth-name-error" className="field-error" role="alert">{errors.displayName}</span>}</div>}
        <div className="field"><label htmlFor="auth-email">Email</label><input id="auth-email" name="email" type="email" autoComplete="email" value={values.email} onChange={change} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email?'auth-email-error':undefined}/>{errors.email&&<span id="auth-email-error" className="field-error" role="alert">{errors.email}</span>}</div>
        <div className="field"><label htmlFor="auth-password">Mật khẩu</label><div className="password-input"><input id="auth-password" name="password" type={showPassword?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} value={values.password} onChange={change} aria-invalid={Boolean(errors.password)} aria-describedby="auth-password-hint"/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><span id="auth-password-hint" className={errors.password?'field-error':'field-hint'} role={errors.password?'alert':undefined}>{errors.password||'Ít nhất 8 ký tự.'}</span></div>
        {mode==='register'&&<div className="field"><label htmlFor="auth-confirm">Nhập lại mật khẩu</label><input id="auth-confirm" name="confirmPassword" type={showPassword?'text':'password'} autoComplete="new-password" value={values.confirmPassword} onChange={change} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword?'auth-confirm-error':undefined}/>{errors.confirmPassword&&<span id="auth-confirm-error" className="field-error" role="alert">{errors.confirmPassword}</span>}</div>}
        {mode==='login'&&<button className="forgot-password" type="button" disabled={authBusy} onClick={forgot}>{vi.auth.forgot}</button>}
        <div className="auth-feedback" aria-live="polite">{authError&&<p className="field-error">{authError}</p>}{authNotice&&<p className="field-success">{authNotice}</p>}</div>
        <Button type="submit" disabled={authBusy||cooldown}>{cooldown?vi.auth.cooldown:authBusy?vi.auth.processing:mode==='register'?vi.auth.registerTab:vi.auth.loginTab}</Button>
      </form>
      <div className="login-divider"><span>hoặc</span></div>
      <Button variant="secondary" disabled={authBusy||cooldown} onClick={async()=>{if(!await login())startCooldown()}}>{vi.auth.google}</Button>
    </Card>
  </main>
}
