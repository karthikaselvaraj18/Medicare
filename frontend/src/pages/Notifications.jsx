import { useState, useCallback, useEffect } from 'react';
import {
  Bell, CheckCircle, XCircle, AlertTriangle, Clock,
  CheckCheck, Send, Info, Trash2
} from 'lucide-react';
import { getNotifications, markRead, markAllRead } from '../services/notificationService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDateTime, formatRelative } from '../utils/dateUtils';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'missed') return n.type === 'missed';
    if (filter === 'confirmed') return n.type === 'confirmed';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'missed':
        return <XCircle size={20} color="var(--color-danger)" />;
      case 'confirmed':
        return <CheckCircle size={20} color="var(--color-success)" />;
      case 'telegram':
      case 'test':
        return <Send size={20} color="var(--color-info)" />;
      default:
        return <Bell size={20} color="var(--color-primary)" />;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts & Notifications</h1>
          <p className="page-subtitle">
            System events, missed dose alerts, and Telegram push delivery history
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={handleMarkAllRead}>
              <CheckCheck size={16} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-2)',
        marginBottom: 'var(--spacing-6)',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--spacing-2)'
      }}>
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'missed', label: 'Missed Alerts' },
          { key: 'confirmed', label: 'Confirmations' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: filter === key ? 600 : 400,
              background: filter === key ? 'var(--color-primary-subtle)' : 'transparent',
              color: filter === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingSpinner size={36} />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Bell />
            <h3>No Notifications</h3>
            <p>You&apos;re completely up to date. No events match this filter.</p>
          </div>
        ) : (
          <div>
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-4)',
                  padding: 'var(--spacing-4) var(--spacing-6)',
                  background: item.is_read ? 'var(--color-surface)' : 'var(--color-surface-2)',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                  borderLeft: item.is_read ? '4px solid transparent' : '4px solid var(--color-primary)',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  flexShrink: 0
                }}>
                  {getIcon(item.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <h4 style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: item.is_read ? 500 : 700,
                      color: 'var(--color-text-primary)'
                    }}>
                      {item.title}
                    </h4>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatRelative(item.created_at)}
                    </span>
                  </div>

                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: 'var(--spacing-2)'
                  }}>
                    {item.message}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-4)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)'
                  }}>
                    <span>{formatDateTime(item.created_at)}</span>
                    {item.type === 'missed' && (
                      <span style={{
                        color: 'var(--color-danger)',
                        background: 'var(--color-danger-light)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 600
                      }}>
                        TELEGRAM ALERT TRIGGERED
                      </span>
                    )}
                  </div>
                </div>

                {!item.is_read && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMarkRead(item.id)}
                    style={{ flexShrink: 0 }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

