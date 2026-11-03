import { useState, useCallback, useEffect } from 'react';
import {
  History as HistoryIcon, Search, Filter, Calendar, CheckCircle,
  XCircle, Clock, AlertTriangle, RefreshCw, Sun, Moon
} from 'lucide-react';
import { getHistory } from '../services/historyService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { formatTime, formatDate, formatDateTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (search.trim()) params.search = search.trim();

      const res = await getHistory(params);
      setHistory(res.data || []);
    } catch {
      toast.error('Failed to load history records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, search]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredRecords = history.filter((item) => {
    const matchesSearch = item.medicine_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDate = !dateFilter || item.reminder_date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalCount = filteredRecords.length;
  const confirmedCount = filteredRecords.filter(r => r.status === 'confirmed').length;
  const missedCount = filteredRecords.filter(r => r.status === 'missed').length;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicine History</h1>
          <p className="page-subtitle">Complete audit log of all scheduled reminder outcomes</p>
        </div>
        <button className="btn btn-secondary" onClick={loadHistory} title="Refresh">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-6)'
      }}>
        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>FILTERED TOTAL</p>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{totalCount}</p>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-4)', borderLeft: '4px solid var(--color-success)' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 600 }}>CONFIRMED DOSES</p>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{confirmedCount}</p>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-4)', borderLeft: '4px solid var(--color-danger)' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontWeight: 600 }}>MISSED DOSES</p>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{missedCount}</p>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>COMPLIANCE RATE</p>
          <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
            {totalCount > 0 ? `${Math.round((confirmedCount / totalCount) * 100)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-4)' }}>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-3)',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', flex: 1, minWidth: 260, flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)'
              }} />
              <input
                type="text"
                placeholder="Search medicine name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 38 }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: 150 }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="missed">Missed</option>
                <option value="active">Active Reminder</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>

            {/* Date Picker */}
            <div style={{ minWidth: 150 }}>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {(search || statusFilter !== 'all' || dateFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter(''); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* History Data Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner size={36} />
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <HistoryIcon />
            <h3>No Records Found</h3>
            <p>No history matches your current filter selection or search query.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Medicine</th>
                  <th>Category / LED</th>
                  <th>Scheduled</th>
                  <th>Actual Confirmation</th>
                  <th>Status</th>
                  <th>Telegram Alert</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {formatDate(row.reminder_date)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{row.medicine_name}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 'var(--font-size-xs)',
                        color: row.category === 'Morning' ? 'var(--color-warning)' : 'var(--color-info)'
                      }}>
                        {row.category === 'Morning' ? <Sun size={13} /> : <Moon size={13} />}
                        {row.category} ({row.led_pin || (row.category === 'Morning' ? 'D6' : 'D7')})
                      </span>
                    </td>
                    <td>{formatTime(row.scheduled_time)}</td>
                    <td>
                      {row.confirmed_at ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                          {formatDateTime(row.confirmed_at)}
                        </span>
                      ) : row.status === 'missed' ? (
                        <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
                          Timed out at {row.missed_at ? formatTime(row.missed_at) : 'N/A'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      {row.telegram_sent ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-success)',
                          fontWeight: 600
                        }}>
                          <CheckCircle size={12} /> Sent
                        </span>
                      ) : row.status === 'missed' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-danger)'
                        }}>
                          <XCircle size={12} /> Pending / Off
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>—</span>
                      )}
                    </td>
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

