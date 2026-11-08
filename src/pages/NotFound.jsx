import { Link } from 'react-router-dom'
import { Header, Page } from '@/app/App'
import { Card } from '@/components/ui'
import { vi } from '@/i18n/vi'

export default function NotFound(){return <Page><Header title={vi.generated.NotFound_5_0} description={vi.generated.NotFound_5_1}/><Card><Link className="button" to="/">{vi.generated.NotFound_5_2}</Link></Card></Page>}
