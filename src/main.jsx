import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import { DataProvider } from './hooks/useData'
import ToastHost from './components/ui/ToastHost'
import './styles/tokens.css'
import './styles/base.css'
import './styles/foundation.css'
import './styles/drawer.css'
import './styles/shell.css'
import './styles/dashboard.css'
import './styles/tasks.css'
import './styles/create.css'
import './styles/mindmap.css'
import './styles/calendar.css'
import './styles/trips.css'
import './styles/contacts.css'
import './styles/login.css'
import './styles/animations.css'
import './styles/charts.css'
import './styles/tags.css'
import './styles/notebooks.css'
import './styles/complete-toggle.css'
import '@fontsource/manrope/vietnamese-500.css'
import '@fontsource/manrope/vietnamese-700.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter><DataProvider><App/><ToastHost/></DataProvider></BrowserRouter>
  </React.StrictMode>,
)
