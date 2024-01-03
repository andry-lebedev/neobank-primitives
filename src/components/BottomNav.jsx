import { NavLink } from 'react-router-dom'
import { Home, Send, PlusCircle, User } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/send', icon: Send, label: 'Send', end: false },
  { to: '/add-money', icon: PlusCircle, label: 'Add money', end: false },
  { to: '/profile', icon: User, label: 'Profile', end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#111827] border-t border-[#374151] md:hidden">
      <div className="flex pb-safe">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-150 ${
                isActive ? 'text-[#F97316]' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
