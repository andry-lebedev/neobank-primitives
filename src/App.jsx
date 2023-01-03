import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import ToastContainer from './components/Toast'
import DevPanel from './components/DevPanel'
import Dashboard from './pages/Dashboard'
import AddMoney from './pages/AddMoney'
import Send from './pages/Send'
import History from './pages/History'
import Profile from './pages/Profile'

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
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500/20 border-b border-amber-500/30 py-2 px-4">
      <WifiOff size={14} className="text-amber-400" />
      <p className="text-xs text-amber-300">No internet connection</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <OfflineBanner />
        <div className="min-h-screen bg-[#111827] font-sans">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-money" element={<AddMoney />} />
            <Route path="/send" element={<Send />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <BottomNav />
          <ToastContainer />
          <DevPanel />
        </div>
      </AppProvider>
    </BrowserRouter>
  )
}
