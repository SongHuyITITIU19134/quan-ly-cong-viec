import { Navigate, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { LoadingState } from '@/components/ui'
import { useData } from '@/hooks/useData'
import Login from '@/pages/Login'
const Dashboard=lazy(()=>import('@/pages/Dashboard'))
const Tasks=lazy(()=>import('@/pages/Tasks'))
const MindMap=lazy(()=>import('@/pages/MindMap'))
const Calendar=lazy(()=>import('@/pages/Calendar'))
const Trips=lazy(()=>import('@/pages/Trips'))
const Contacts=lazy(()=>import('@/pages/Contacts'))
const Notebooks=lazy(()=>import('@/pages/Notebooks'))
const NotFound=lazy(()=>import('@/pages/NotFound'))
const Settings=lazy(()=>import('@/pages/Settings'))
const TagPreview=import.meta.env.DEV?lazy(()=>import('@/components/tags/TagPreview')):null
export function Page({children}){return <div className="page">{children}</div>}
export function Header({title,description,action}){return <div className="page-head"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>}
export function RouteGuard(){const{mode,user,authPending}=useData();if(mode==='firebase'&&authPending)return <LoadingState/>;if(mode==='firebase'&&!user)return <Login/>;return <AppLayout/>}

export default function App(){return <Suspense fallback={<LoadingState/>}><Routes><Route path="login" element={<Navigate to="/" replace/>}/><Route element={<RouteGuard/>}><Route index element={<Dashboard/>}/><Route path="cong-viec" element={<Tasks/>}/><Route path="so-do" element={<MindMap/>}/><Route path="lich" element={<Calendar/>}/><Route path="cong-tac" element={<Trips/>}/><Route path="danh-ba" element={<Contacts/>}/><Route path="so-tay" element={<Notebooks/>}/><Route path="so-tay/:notebookId" element={<Notebooks/>}/><Route path="cai-dat" element={<Settings/>}/>{TagPreview&&<Route path="__tags" element={<TagPreview/>}/>}<Route path="*" element={<NotFound/>}/></Route></Routes></Suspense>}
