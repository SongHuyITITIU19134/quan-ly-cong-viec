import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { Page } from '@/app/App'
import { Card } from '@/components/ui'
import { vi } from '@/i18n/vi'

export default function NotFound(){return <Page><Card className="not-found"><span className="not-found-icon"><Compass size={28}/></span><p className="eyebrow">{vi.notFound.eyebrow}</p><strong aria-hidden="true">404</strong><h1>{vi.notFound.title}</h1><p>{vi.notFound.description}</p><Link className="button" to="/"><ArrowLeft size={18}/><span>{vi.notFound.home}</span></Link></Card></Page>}
