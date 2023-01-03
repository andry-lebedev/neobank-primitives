import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import ToastContainer from './components/Toast'
import Dashboard from './pages/Dashboard'
import AddMoney from './pages/AddMoney'
import Send from './pages/Send'
import History from './pages/History'
import Profile from './pages/Profile'
import DevPanel from './components/DevPanel'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
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
