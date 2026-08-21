import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Target, User } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/timeline', label: 'Timeline', Icon: CalendarDays, end: false },
  { to: '/goals', label: 'Goals', Icon: Target, end: false },
  { to: '/profile', label: 'Profile', Icon: User, end: false },
];

export default function TabBar() {
  return (
    <div className="tab-bar">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="tab-item"
          style={({ isActive }) => ({
            color: isActive ? 'var(--color-accent-700)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
          })}
        >
          {({ isActive }) => (
            <>
              <span
                className="tab-item-indicator"
                style={{ background: isActive ? 'var(--color-accent)' : 'transparent' }}
              />
              <Icon width={20} height={20} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
