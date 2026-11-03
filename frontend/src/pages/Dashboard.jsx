import { useState, useCallback } from 'react';
import {
  Pill, CheckCircle, XCircle, Clock, Wifi, WifiOff,
  Sun, Moon, Bell, Activity, User, Calendar, TrendingUp, AlertCircle,
} from 'lucide-react';
import { getDashboard } from '../services/dashboardService';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatTime, formatDate, formatDateTime } from '../utils/dateUtils';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
      setError(null);
    } catch {
      setError('Could not load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchData, 5000, true);

  if (loading) return <LoadingSpinner size={36} />;

  const stats = data?.stats || {};
  const patient = data?.patient || {};
  const activity = data?.recent_activity || [];
  const nextReminder = data?.next_reminder;
  const deviceOnline = data?.device_online ?? false;
  const telegramConfigured = data?.telegram_configured ?? false;
  const morningStatus = data?.morning_status || 'upcoming';
  const nightStatus = data?.night_status || 'upcoming';

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.full_name || 'Caretaker'}</p>
        </div>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--color-warning-light)', color: 'var(--color-warning)', fontSize: 'var(--font-size-sm)' }}>
            <AlertCircle size={14} />{error}
          </div>
        )}
      </div>

      {/* Patient banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-5) var(--spacing-6)', marginBottom: 'var(--spacing-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="white" />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-xs)', fontWeight: 500 }}>PATIENT</p>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{patient.patient_name || 'No patient added'}</p>
            {patient.patient_age && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--font-size-sm)' }}>Age {patient.patient_age} &nbsp;·&nbsp; {patient.patient_contact}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-full)', background: deviceOnline ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${deviceOnline ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, color: deviceOnline ? '#4ADE80' : '#F87171', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
            {deviceOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            ESP8266 {deviceOnline ? 'Online' : 'Offline'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-full)', background: telegramConfigured ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', border: `1px solid ${telegramConfigured ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)'}`, color: telegramConfigured ? '#4ADE80' : '#FCD34D', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
            <Bell size={12} />
            Telegram {telegramConfigured ? 'Configured' : 'Not Set'}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
        <StatCard icon={Pill}        label="Total Scheduled" value={stats.total ?? 0}     color="var(--color-info)"     />
        <StatCard icon={CheckCircle} label="Confirmed Today" value={stats.confirmed ?? 0} color="var(--color-success)"  />
        <StatCard icon={XCircle}     label="Missed Today"    value={stats.missed ?? 0}    color="var(--color-danger)"   />
        <StatCard icon={Clock}       label="Upcoming"        value={stats.upcoming ?? 0}  color="var(--color-upcoming)" />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
        {/* Today's status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>Today&apos;s Status</h3>
          </div>

          {[
            { label: 'Morning Medicine', ledPin: 'D6', status: morningStatus, Icon: Sun, activeColor: 'var(--color-warning)', activeBg: 'var(--color-warning-light)' },
            { label: 'Night Medicine',   ledPin: 'D7', status: nightStatus,   Icon: Moon, activeColor: 'var(--color-info)',   activeBg: 'var(--color-info-light)'    },
          ].map(({ label, ledPin, status, Icon, activeColor, activeBg }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', background: status === 'active' ? activeBg : 'var(--color-surface-2)', border: `1px solid ${status === 'active' ? activeColor : 'var(--color-border)'}`, marginBottom: 'var(--spacing-3)', ...(status === 'active' ? { animation: 'pulse 2s ease-in-out infinite' } : {}) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: status === 'confirmed' ? 'var(--color-success-light)' : status === 'missed' ? 'var(--color-danger-light)' : activeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={status === 'confirmed' ? 'var(--color-success)' : status === 'missed' ? 'var(--color-danger)' : activeColor} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{label}</p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>LED {ledPin}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <StatusBadge status={status} />
                {status === 'active' && <span style={{ fontSize: 'var(--font-size-xs)', color: activeColor, fontWeight: 700 }}>● ACTIVE</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Next reminder + weekly */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
              <Clock size={18} color="var(--color-primary)" />
              <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>Next Reminder</h3>
            </div>
            {nextReminder ? (
              <div>
                <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>{formatTime(nextReminder.scheduled_time)}</p>
                <p style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', marginTop: 4 }}>{nextReminder.medicine_name}</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>{nextReminder.category} · {formatDate(nextReminder.reminder_date)}</p>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                <CheckCircle size={24} color="var(--color-success)" style={{ marginBottom: 8 }} />
                <p>No upcoming reminders for today.</p>
              </div>
            )}
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
              <TrendingUp size={18} color="var(--color-primary)" />
              <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>This Week</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              {[
                { label: 'Confirmed', value: stats.week_confirmed ?? 0, color: 'var(--color-success)' },
                { label: 'Missed',    value: stats.week_missed ?? 0,    color: 'var(--color-danger)'  },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: 'var(--spacing-3)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color }}>{value}</p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
          <Activity size={18} color="var(--color-primary)" />
          <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>Recent Activity</h3>
        </div>
        {activity.length === 0 ? (
          <div className="empty-state"><Pill /><h3>No activity yet</h3><p>Add medicine schedules to start tracking.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Medicine</th><th>Category</th><th>Scheduled</th><th>Confirmed At</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500 }}>{row.medicine_name}</td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', color: row.category === 'Morning' ? 'var(--color-warning)' : 'var(--color-info)' }}>{row.category === 'Morning' ? <Sun size={12}/> : <Moon size={12}/>}{row.category}</span></td>
                    <td>{formatTime(row.scheduled_time)}</td>
                    <td>{row.confirmed_at ? formatDateTime(row.confirmed_at) : '—'}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{formatDate(row.reminder_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

