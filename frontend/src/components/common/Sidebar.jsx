import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Pill, History, Bell, Settings, LogOut,
  Heart, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/medicines',      icon: Pill,             label: 'Medicines'  },
  { to: '/history',        icon: History,          label: 'History'    },
  { to: '/notifications',  icon: Bell,             label: 'Alerts'     },
  { to: '/settings',       icon: Settings,         label: 'Settings'   },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--color-primary-dark)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: 'var(--spacing-6)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Heart size={20} color="white" fill="white" />
        </div>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 'var(--font-size-base)', lineHeight: 1.2 }}>MediCare</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-size-xs)' }}>Monitor</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: 'var(--spacing-4) var(--spacing-3)', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)',
              padding: 'var(--spacing-3) var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-1)',
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 'var(--font-size-sm)',
              transition: 'all var(--transition-fast)',
              textDecoration: 'none',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={14} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{
        padding: 'var(--spacing-4) var(--spacing-3)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          padding: 'var(--spacing-3) var(--spacing-4)',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--spacing-2)',
        }}>
          <p style={{ color: 'white', fontWeight: 600, fontSize: 'var(--font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'Caretaker'}</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-size-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            color: 'rgba(255,255,255,0.6)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            width: '100%',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
