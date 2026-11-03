import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useState, useCallback } from 'react';
import { getDashboard } from '../../services/dashboardService';
import { getNotifications } from '../../services/notificationService';
import { usePolling } from '../../hooks/usePolling';

export default function AppLayout() {
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchTopBarData = useCallback(async () => {
    try {
      const [dashRes, notifRes] = await Promise.all([getDashboard(), getNotifications()]);
      setDeviceOnline(dashRes.data?.device_online ?? false);
      const unread = notifRes.data?.filter(n => !n.is_read) ?? [];
      setUnreadCount(unread.length);
    } catch { /* silent */ }
  }, []);

  usePolling(fetchTopBarData, 5000, true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar deviceOnline={deviceOnline} unreadCount={unreadCount} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
