import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TierListPage } from './features/tier-list/TierListPage'
import '@fontsource-variable/inter/wght.css'
import './app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TierListPage />
  </StrictMode>,
)
