import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function useTransitionNavigate(){
  const navigate=useNavigate()
  const reduced=useReducedMotion()
  return(to,options)=>{
    const lowPower=(navigator.hardwareConcurrency||4)<=8||(navigator.deviceMemory||4)<=8
    if(document.startViewTransition&&!reduced&&!lowPower)document.startViewTransition(()=>navigate(to,options))
    else navigate(to,options)
  }
}
