import { useEffect, useState } from 'react'

export function useInView(ref,{rootMargin='0px',once=true}={}){
  const[inView,setInView]=useState(false)
  useEffect(()=>{const node=ref.current;if(!node||!('IntersectionObserver'in window)){setInView(true);return}const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setInView(true);if(once)observer.disconnect()}else if(!once)setInView(false)},{rootMargin});observer.observe(node);return()=>observer.disconnect()},[once,ref,rootMargin])
  return inView
}
