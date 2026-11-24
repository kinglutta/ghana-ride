import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import UserContext from './context/UserContext'
import CaptainContext from './context/CaptainContext.jsx'
import SocketProvider from './context/SocketContext'

// PWA: register service worker for offline app shell
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => console.log('SW registered', reg.scope),
      (err) => console.log('SW registration failed', err)
    );
  });
}

createRoot(document.getElementById('root')).render(
  <UserContext>
    <CaptainContext>
      <SocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </CaptainContext>
  </UserContext>
)
// Force redeploy Fri, May 30, 2025  2:17:34 AM
