import { Link } from 'react-router-dom'
import { Header, Page } from '@/app/App'
import { Card } from '@/components/ui'

export default function NotFound(){return <Page><Header title="Không tìm thấy trang" description="Đường dẫn này không tồn tại hoặc đã được di chuyển."/><Card><Link className="button" to="/">Về trang chủ</Link></Card></Page>}
