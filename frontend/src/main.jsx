import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from "./App"
import { register } from './serviceWorkerRegistration'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker
register();