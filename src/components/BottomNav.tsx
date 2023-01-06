import { NavLink } from 'react-router-dom'
import { navItems } from '../features'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-base border-t border-card-hover md:hidden">
      <div className="flex pb-safe">
        {navItems.map(({ id, route, navIcon: Icon, navLabel, end }) => (
          <NavLink
            key={id}
            to={route}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-150 ${
                isActive ? 'text-accent' : 'text-subtle hover:text-fg-muted'
              }`
            }
          >
            {Icon && <Icon size={22} />}
            <span className="text-[10px] font-medium">{navLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
