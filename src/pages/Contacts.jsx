import { useId, useMemo, useState } from 'react'
import { Mail, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { Page, Header } from '@/app/App'
import { Button, Card, Drawer, EmptyState, Modal, StatusBadge } from '@/components/ui'
import { useActions, useDataState, useToast } from '@/hooks/useData'
import { normalizeText } from '@/lib/tasks'
import { vi } from '@/i18n/vi'
import { CONTACT_NAME_MAX, CONTACT_NOTES_MAX, CONTACT_ORGANIZATION_MAX, CONTACT_TITLE_MAX } from '@/lib/limits'
import { buildDeleteOps, buildRestoreOps } from '@/lib/relations'
import { useTransitionNavigate } from '@/hooks/useTransitionNavigate'
import { buildIndexes } from '@/lib/indexes'

const blank = { fullName: '', organization: '', title: '', phone: '', email: '', notes: '', isSelf: false }
function RoleGroup({ label, tasks }) { return <div><strong>{label} ({tasks.length})</strong>{tasks.map(task => <div className="related-row" key={task.id}><span>{task.title}</span><StatusBadge value={task.status}/></div>)}</div> }
function ContactForm({ contact, onSave, onCancel, formId, showActions=true }) {
  const prefix = useId()
  const [saving, setSaving] = useState(false)
  const submit = async event => { setSaving(true); const saved = await onSave(event); if (!saved) setSaving(false) }
  const id = name => `${prefix}-${name}`
  return <form id={formId} onSubmit={submit}>
    <div className="form-grid">
      <div className="field span-2"><label htmlFor={id('fullName')}>{vi.generated.Contacts_22_0}</label><input id={id('fullName')} data-autofocus name="fullName" required maxLength={CONTACT_NAME_MAX} defaultValue={contact.fullName}/></div>
      <div className="field"><label htmlFor={id('title')}>{vi.generated.Contacts_23_1}</label><input id={id('title')} name="title" maxLength={CONTACT_TITLE_MAX} defaultValue={contact.title}/></div>
      <div className="field"><label htmlFor={id('organization')}>{vi.generated.Contacts_24_2}</label><input id={id('organization')} name="organization" maxLength={CONTACT_ORGANIZATION_MAX} defaultValue={contact.organization}/></div>
      <div className="field"><label htmlFor={id('phone')}>{vi.generated.Contacts_25_3}</label><input id={id('phone')} name="phone" type="tel" pattern="[0-9+ .-]{8,15}" defaultValue={contact.phone}/></div>
      <div className="field"><label htmlFor={id('email')}>Email</label><input id={id('email')} name="email" type="email" defaultValue={contact.email}/></div>
      <div className="field span-2"><label htmlFor={id('notes')}>{vi.generated.Contacts_27_4}</label><textarea id={id('notes')} name="notes" maxLength={CONTACT_NOTES_MAX} defaultValue={contact.notes}/></div>
    </div>
    {showActions&&<div className="inline-actions"><Button variant="secondary" type="button" onClick={onCancel} disabled={saving}>{vi.generated.Contacts_29_5}</Button><Button type="submit" disabled={saving}>{saving ? vi.generated.Contacts_29_6 : vi.generated.Contacts_29_7}</Button></div>}
  </form>
}

export default function Contacts() {
  const { data } = useDataState()
  const { create, update, batch } = useActions()
  const toast = useToast()
  const navigate=useTransitionNavigate()
  const [q, setQ] = useState(''), [selected, setSelected] = useState(null), [editing, setEditing] = useState(null), [confirm, setConfirm] = useState(null)
  const contactFormId='contact-editor-form'
  const indexes=useMemo(()=>buildIndexes(data),[data.projects,data.tasks,data.contacts,data.trips,data.notes])
  const list = useMemo(() => data.contacts.filter(c => normalizeText(`${c.fullName} ${c.organization}`).includes(normalizeText(q))), [data.contacts, q])
  const related = c => indexes.contactRelations.get(c.id) || { assign: [], assignee: [], collab: [], trips: [], notes: [] }
  const save = async event => { event.preventDefault(); const value = Object.fromEntries(new FormData(event.currentTarget)); const result = editing.id ? await update('contacts', editing.id, value) : await create('contacts', { ...blank, ...value }); if (!result) return false; toast(vi.generated.Contacts_43_8); setEditing(null); return true }
  const doDelete = async () => { if(confirm.id==='self')return;const ops=buildDeleteOps('contact',confirm.id,data),undo=buildRestoreOps(ops,data);if(!await batch(ops))return;setConfirm(null);setSelected(null);toast(vi.generated.Contacts_44_9,{label:vi.action.undo,onClick:()=>batch(undo)}) }
  return <Page>
    <Header title={vi.nav.contacts} description={vi.generated.Contacts_46_10(data.contacts.length)} action={<Button icon={Plus} onClick={() => setEditing(blank)}>{vi.generated.Contacts_46_11}</Button>}/>
    <div className="toolbar"><div className="search"><Search size={18}/><input aria-label={vi.generated.Contacts_47_12} value={q} onChange={e => setQ(e.target.value)} placeholder={vi.generated.Contacts_47_13}/></div></div>
    <div className="contacts-grid">{list.map(contact => {const index=data.contacts.indexOf(contact);return <Card key={contact.id} className={`contact-card label-theme-${index%8+1}`}><button className="contact-main" onClick={() => setSelected(contact)}><span className="avatar avatar-lg">{contact.fullName.slice(0, 1)}</span><span><strong>{contact.fullName}</strong><small>{contact.title}</small>{contact.organization&&<span className="contact-org-chip">{contact.organization}</span>}</span></button><div className="contact-actions">{contact.phone && <a href={`tel:${contact.phone}`} aria-label={vi.generated.Contacts_48_14(contact.fullName)}><Phone size={17}/></a>}{contact.email && <a href={`mailto:${contact.email}`} aria-label={vi.generated.Contacts_48_15(contact.fullName)}><Mail size={17}/></a>}</div></Card>})}{!list.length && <Card><EmptyState title={q ? vi.generated.Contacts_48_16 : vi.generated.Contacts_48_17} action={q?<Button variant="secondary" onClick={()=>setQ('')}>{vi.generated.Contacts_48_18}</Button>:<Button icon={Plus} onClick={() => setEditing(blank)}>{vi.generated.Contacts_48_19}</Button>}/></Card>}</div>
    {editing && <Drawer title={editing.id ? vi.generated.Contacts_49_20 : vi.generated.Contacts_49_21} onClose={() => setEditing(null)} actions={<><Button variant="secondary" onClick={()=>setEditing(null)}>{vi.generated.Contacts_49_22}</Button><Button type="submit" form={contactFormId}>{vi.generated.Contacts_49_23}</Button></>}><ContactForm formId={contactFormId} showActions={false} contact={editing} onSave={save} onCancel={() => setEditing(null)}/></Drawer>}
    {selected && <Modal title={selected.fullName} onClose={() => setSelected(null)}><div className="contact-detail-layout"><div className="contact-profile-column"><div className={`profile-head label-theme-${data.contacts.indexOf(selected)%8+1}`}><span className="avatar avatar-xl">{selected.fullName.slice(0, 1)}</span><div><h3>{selected.title}</h3><p>{selected.organization}</p></div></div>{selected.phone && <p><Phone size={15}/> <a href={`tel:${selected.phone}`}>{selected.phone}</a></p>}{selected.email && <p><Mail size={15}/> <a href={`mailto:${selected.email}`}>{selected.email}</a></p>}</div><div className="related-block"><h3>{vi.generated.Contacts_50_24}</h3><RoleGroup label={vi.generated.Contacts_50_25} tasks={related(selected).assign}/><RoleGroup label={vi.generated.Contacts_50_26} tasks={related(selected).assignee}/><RoleGroup label={vi.generated.Contacts_50_27} tasks={related(selected).collab}/><h3>{vi.generated.Contacts_50_28}</h3>{related(selected).trips.map(trip=><p key={trip.id}>{trip.name}</p>)}<h3>{vi.generated.Contacts_50_29}</h3>{related(selected).notes.map(note=><p key={note.id}>{note.title}</p>)}<Button variant="secondary" onClick={()=>navigate(`/so-tay?new=note&contactId=${selected.id}`)}>{vi.generated.Contacts_50_30}</Button></div></div><div className="inline-actions"><Button variant="secondary" onClick={() => setEditing(selected)}>{vi.generated.Contacts_50_31}</Button>{!selected.isSelf && <Button variant="danger" icon={Trash2} onClick={() => setConfirm(selected)}>{vi.generated.Contacts_50_32}</Button>}</div></Modal>}
    {confirm && <Modal title={vi.generated.Contacts_51_33} onClose={() => setConfirm(null)} actions={<><Button variant="secondary" onClick={() => setConfirm(null)}>{vi.generated.Contacts_51_34}</Button><Button variant="danger" onClick={doDelete}>{vi.generated.Contacts_51_35}</Button></>}><p>{vi.generated.Contacts_51_36}{related(confirm).assign.length + related(confirm).assignee.length + related(confirm).collab.length}{vi.generated.Contacts_51_37}{related(confirm).trips.length}{vi.generated.Contacts_51_38}</p></Modal>}
  </Page>
}
