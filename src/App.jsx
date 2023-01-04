import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import ToastContainer from './components/Toast'
import DevPanel from './components/DevPanel'
import { routeItems } from './features'

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-warning/20 border-b border-warning/30 py-2 px-4">
      <WifiOff size={14} className="text-warning" />
      <p className="text-xs text-warning">No internet connection</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <OfflineBanner />
        <div className="min-h-screen bg-base font-sans">
          <Routes>
            {routeItems.map(({ id, route, element: Element }) => (
              <Route key={id} path={route} element={<Element />} />
            ))}
          </Routes>
          <BottomNav />
          <ToastContainer />
          <DevPanel />
        </div>
      </AppProvider>
    </BrowserRouter>
  )
}
