import { useEffect, useState } from 'react'
import { CheckCircle2, CircleDashed, Gauge, TriangleAlert } from 'lucide-react'
import { getCompletionGauge } from './completionGauge'
import { vi } from '@/i18n/vi'

const TICK_COUNT=40
const icons={empty:CircleDashed,danger:TriangleAlert,warn:TriangleAlert,ok:Gauge,good:CheckCircle2,achieved:CheckCircle2}

function Flame(){
  return <g className="gauge-flame" aria-hidden="true" transform="translate(82 55)">
    <path className="gauge-flame-layer flame-outer" d="M18 42C5 35 2 24 9 14c3 7 7 7 8-2 1-6 5-10 9-12 1 8 9 12 9 23 0 10-7 17-17 19Z"/>
    <path className="gauge-flame-layer flame-middle" d="M19 39c-8-4-10-11-5-18 2 5 5 5 6-1 1-4 3-6 6-8 0 6 5 9 5 16 0 6-5 11-12 11Z"/>
    <path className="gauge-flame-layer flame-inner" d="M20 37c-4-2-5-6-3-10 2 3 3 2 4-1 1-2 2-4 4-5 0 4 3 6 3 10 0 4-3 6-8 6Z"/>
  </g>
}

export default function CompletionGauge({done,total,overdue=0}){
  const gauge=getCompletionGauge(done,total),copy=vi.dashboard.completion.states[gauge.state],Icon=icons[gauge.state]
  const[reducedMotion,setReducedMotion]=useState(()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false)
  useEffect(()=>{
    const media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')
    if(!media)return undefined
    const change=event=>setReducedMotion(event.matches)
    media.addEventListener?.('change',change)
    return()=>media.removeEventListener?.('change',change)
  },[])
  const ariaLabel=vi.dashboard.completion.aria(gauge.done,gauge.total,gauge.percent,copy)
  return <section className={`card completion-gauge gauge-${gauge.state} ${reducedMotion?'is-reduced-motion':''}`} aria-labelledby="completion-gauge-title">
    <h2 id="completion-gauge-title">{vi.dashboard.completion.title}</h2>
    <div className="completion-gauge-body">
      <svg className="completion-gauge-visual" viewBox="0 0 200 118" role="img" aria-label={ariaLabel}>
        <g className="gauge-ticks" aria-hidden="true">{Array.from({length:TICK_COUNT},(_,index)=><line className={gauge.ratio>0&&index/(TICK_COUNT-1)<=gauge.ratio?'is-filled':''} x1="100" y1="14" x2="100" y2="25" transform={`rotate(${-90+index*180/(TICK_COUNT-1)} 100 100)`} key={index}/>)}</g>
        {gauge.state==='achieved'&&<Flame/>}
        <g className="gauge-needle" aria-hidden="true" style={{'--gauge-angle':`${-90+gauge.ratio*180}deg`}}><line x1="100" y1="100" x2="100" y2="38"/><circle cx="100" cy="100" r="9"/></g>
      </svg>
      <div className="completion-gauge-copy"><strong>{gauge.done}/{gauge.total}</strong><span>{gauge.percent}%</span>
        <span className="completion-state-chip"><Icon size={14} aria-hidden="true"/>{copy}</span></div>
    </div>
    {gauge.state==='danger'&&<p className="completion-warning"><TriangleAlert size={15} aria-hidden="true"/>{vi.dashboard.completion.warning(gauge.total-gauge.done,overdue)}</p>}
  </section>
}
