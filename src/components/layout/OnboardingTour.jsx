import { useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { vi } from '@/i18n/vi'

const steps=[
  {title:vi.onboarding.taskTitle,description:vi.onboarding.taskDescription},
  {title:vi.onboarding.calendarTitle,description:vi.onboarding.calendarDescription},
  {title:vi.onboarding.noteTitle,description:vi.onboarding.noteDescription}
]

export default function OnboardingTour({onFinish,onSample}){
  const[step,setStep]=useState(0),[busy,setBusy]=useState(false),current=steps[step]
  const run=async action=>{setBusy(true);await action();setBusy(false)}
  return <Modal title={vi.onboarding.title} onClose={()=>run(onFinish)} busy={busy} actions={<>
    <Button variant="ghost" disabled={busy} onClick={()=>run(onFinish)}>{vi.onboarding.skip}</Button>
    {step<steps.length-1&&<Button disabled={busy} onClick={()=>setStep(value=>value+1)}>{vi.onboarding.next}</Button>}
  </>}>
    <div className="onboarding-tour">
      <p className="eyebrow">{vi.onboarding.step(step+1,steps.length)}</p>
      <h2>{current.title}</h2><p>{current.description}</p>
      {step===steps.length-1&&<div className="onboarding-choices">
        <Button disabled={busy} onClick={()=>run(onSample)}>{vi.onboarding.useSample}</Button>
        <Button variant="secondary" disabled={busy} onClick={()=>run(onFinish)}>{vi.onboarding.startEmpty}</Button>
      </div>}
    </div>
  </Modal>
}
