import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { purgeLegacyDemoStorage } from './utils/authSession.js'
import { initNativeApp } from './lib/nativeApp.js'

purgeLegacyDemoStorage()
initNativeApp()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
