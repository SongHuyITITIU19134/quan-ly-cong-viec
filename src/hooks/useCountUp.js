import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function useCountUp(value,{duration=600}={}){
  const nodeRef=useRef(null)
  const reduced=useReducedMotion()
  useEffect(()=>{
    const node=nodeRef.current
    if(!node)return undefined
    node.textContent=String(value)
    if(reduced)return undefined
    let frame=0,observer
    const animate=()=>{
      const start=performance.now()
      const tick=now=>{
        const progress=Math.min(1,(now-start)/duration)
        node.textContent=String(Math.round(value*(1-(1-progress)**4)))
        if(progress<1)frame=requestAnimationFrame(tick)
      }
      frame=requestAnimationFrame(tick)
    }
    if('IntersectionObserver'in window){
      observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){observer.disconnect();animate()}},{rootMargin:'80px'})
      observer.observe(node)
    }else animate()
    return()=>{observer?.disconnect();cancelAnimationFrame(frame)}
  },[duration,reduced,value])
  return nodeRef
}
