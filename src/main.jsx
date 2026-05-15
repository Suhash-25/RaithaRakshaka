import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pwa'
import { seedOfflineData } from '@/utils/dataSeed'
import App from './App.jsx'

// Pre-populate IndexedDB with offline data on first load
seedOfflineData()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
