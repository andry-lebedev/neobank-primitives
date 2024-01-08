import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="p-8 font-sans">v2 scaffold OK</div>
  </StrictMode>,
)
