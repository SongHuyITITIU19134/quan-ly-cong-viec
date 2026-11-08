import { Check } from 'lucide-react'
import { vi } from '@/i18n/vi'

const stopPropagation=event=>event.stopPropagation()

export default function CompleteToggle({checked=false,onChange,label,size='md',showLabel=false,disabled=false}){
  const accessibleLabel=(checked?vi.completeToggle.reopen:vi.completeToggle.complete)(label)
  return <button
    type="button"
    className={`completion-toggle completion-toggle--${size}${showLabel?' completion-toggle--labeled':''}`}
    aria-pressed={checked}
    aria-label={accessibleLabel}
    title={accessibleLabel}
    disabled={disabled}
    draggable={false}
    onPointerDown={stopPropagation}
    onMouseDown={stopPropagation}
    onTouchStart={stopPropagation}
    onKeyDown={stopPropagation}
    onKeyUp={stopPropagation}
    onDragStart={event=>{event.preventDefault();event.stopPropagation()}}
    onClick={event=>{event.stopPropagation();if(!disabled)onChange(!checked)}}
  >
    <span className="completion-toggle__icon" aria-hidden="true">{checked&&<Check strokeWidth={3}/>}</span>
    {showLabel&&<span className="completion-toggle__text">{checked?vi.completeToggle.checked:vi.completeToggle.unchecked}</span>}
  </button>
}
