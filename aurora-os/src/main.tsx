import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './core/native'
import './core/downloads'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
