import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ActionHistoryProvider } from './history/ActionHistoryContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ActionHistoryProvider>
      <App />
    </ActionHistoryProvider>
  </StrictMode>,
)
