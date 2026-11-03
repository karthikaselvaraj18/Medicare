import { Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ deviceOnline = false, unreadCount = 0 }) {
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--spacing-6)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Time */}
      <div>
        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {format(now, 'EEEE, dd MMM yyyy')}
        </p>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {format(now, 'hh:mm:ss a')} IST
        </p>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
        {/* Device Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
          padding: '0.3rem var(--spacing-3)',
          borderRadius: 'var(--radius-full)',
          background: deviceOnline ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          fontSize: 'var(--font-size-xs)', fontWeight: 600,
          color: deviceOnline ? 'var(--color-success)' : 'var(--color-danger)',
        }}>
          {deviceOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {deviceOnline ? 'Device Online' : 'Device Offline'}
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          style={{
            position: 'relative', background: 'none', border: 'none',
            color: 'var(--color-text-secondary)', cursor: 'pointer',
            padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)',
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--color-danger)', color: 'white',
              fontSize: '10px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
