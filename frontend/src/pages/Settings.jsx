import { useState, useCallback, useEffect } from 'react';
import {
  Settings as SettingsIcon, User, Users, Send, Cpu,
  Clock, Shield, Save, CheckCircle, AlertCircle, LogOut,
  ExternalLink, Key, RefreshCw
} from 'lucide-react';
import { getSettings, updateSettings, testTelegram } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDateTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramResult, setTelegramResult] = useState(null);

  const [form, setForm] = useState({
    // Caretaker
    full_name: '',
    email: '',
    contact_number: '',
    // Patient
    patient_name: '',
    patient_age: '',
    patient_contact: '',
    // Telegram
    telegram_chat_id: '',
    // System
    reminder_timeout_seconds: 20,
    // Device info (read-only)
    device_token: '',
    device_name: '',
    device_ip: '',
    last_seen: null,
    is_online: false,
  });

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      if (res.data) {
        setForm(prev => ({
          ...prev,
          ...res.data,
          patient_age: res.data.patient_age || '',
          reminder_timeout_seconds: res.data.reminder_timeout_seconds || 20
        }));
      }
    } catch {
      toast.error('Could not load current settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        full_name: form.full_name,
        contact_number: form.contact_number,
        patient_name: form.patient_name,
        patient_age: parseInt(form.patient_age) || null,
        patient_contact: form.patient_contact,
        telegram_chat_id: form.telegram_chat_id,
        reminder_timeout_seconds: parseInt(form.reminder_timeout_seconds) || 20
      });
      toast.success('Settings updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramResult(null);
    try {
      const res = await testTelegram();
      setTelegramResult({
        success: true,
        message: res.data?.message || 'Telegram test message sent successfully! Check your Telegram app.'
      });
      toast.success('Telegram test sent!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to deliver Telegram message. Verify Chat ID and Bot setup.';
      setTelegramResult({
        success: false,
        message: msg
      });
      toast.error(msg);
    } finally {
      setTestingTelegram(false);
    }
  };

  if (loading) return <LoadingSpinner size={36} />;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure caretaker profile, patient details, Telegram alerts, and IoT device parameters</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Caretaker Profile */}
        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Caretaker Profile</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Account credentials and communication contact</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-4)' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={form.full_name}
                onChange={e => handleChange('full_name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address (Read-Only)</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                disabled
                style={{ background: 'var(--color-surface-2)', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="tel"
                className="form-input"
                value={form.contact_number}
                onChange={e => handleChange('contact_number', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--color-upcoming-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={20} color="var(--color-upcoming)" />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Patient Information</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Elderly recipient of scheduled medicine reminders</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-4)' }}>
            <div className="form-group">
              <label className="form-label">Patient Name</label>
              <input
                type="text"
                className="form-input"
                value={form.patient_name}
                onChange={e => handleChange('patient_name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Patient Age</label>
              <input
                type="number"
                min="1"
                max="120"
                className="form-input"
                value={form.patient_age}
                onChange={e => handleChange('patient_age', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency / Patient Contact</label>
              <input
                type="tel"
                className="form-input"
                value={form.patient_contact}
                onChange={e => handleChange('patient_contact', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Telegram Configuration */}
        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--color-info-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Send size={20} color="var(--color-info)" />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Telegram Bot Alert Integration</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Direct push notification when patient misses a dose</p>
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-4)'
          }}>
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              Setup Steps with @MediCare_Alert_Bot:
            </p>
            <ol style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
              <li>Open Telegram and search for <strong>@MediCare_Alert_Bot</strong></li>
              <li>Press <code>/start</code> in the chat with the bot.</li>
              <li>To obtain your Chat ID, message <strong>@userinfobot</strong> or retrieve it from your bot start response.</li>
              <li>Paste your numerical <strong>Telegram Chat ID</strong> below and save settings.</li>
            </ol>
          </div>

          <div className="form-group">
            <label className="form-label">Caretaker Telegram Chat ID</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 7735871450"
                value={form.telegram_chat_id}
                onChange={e => handleChange('telegram_chat_id', e.target.value)}
                style={{ maxWidth: 350 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTestTelegram}
                disabled={testingTelegram || !form.telegram_chat_id}
              >
                {testingTelegram ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Sending Test...
                  </span>
                ) : (
                  <>
                    <Send size={15} /> Send Test Telegram Alert
                  </>
                )}
              </button>
            </div>
          </div>

          {telegramResult && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-3)',
              padding: 'var(--spacing-3) var(--spacing-4)',
              borderRadius: 'var(--radius-md)',
              background: telegramResult.success ? 'var(--color-success-light)' : 'var(--color-danger-light)',
              color: telegramResult.success ? 'var(--color-success)' : 'var(--color-danger)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--spacing-3)'
            }}>
              {telegramResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{telegramResult.message}</span>
            </div>
          )}
        </div>

        {/* Hardware & Timeout Settings */}
        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--color-warning-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Cpu size={20} color="var(--color-warning)" />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>IoT Hardware & Reminder Rules</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>ESP8266 NodeMCU device connection parameters and timeouts</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
            <div className="form-group">
              <label className="form-label">Missed Reminder Timeout</label>
              <select
                className="form-input"
                value={form.reminder_timeout_seconds}
                onChange={e => handleChange('reminder_timeout_seconds', Number(e.target.value))}
              >
                <option value={20}>20 Seconds (Academic Demo Mode)</option>
                <option value={60}>1 Minute</option>
                <option value={300}>5 Minutes</option>
                <option value={600}>10 Minutes (Production Recommended)</option>
                <option value={900}>15 Minutes</option>
              </select>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                If patient doesn't press the D2 button within this period, buzzer stops and Telegram alert fires.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Hardware Device Status</label>
              <div style={{
                padding: 'var(--spacing-3)',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
                  <span style={{ fontWeight: 600, color: form.is_online ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {form.is_online ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Device Name:</span>
                  <span>{form.device_name || 'ESP8266 NodeMCU'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Last Known IP:</span>
                  <span>{form.device_ip || '192.168.x.x'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Last Ping:</span>
                  <span>{form.last_seen ? formatDateTime(form.last_seen) : 'Never'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Device API Security Token (firmware authentication)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <input
                type="text"
                className="form-input"
                value={form.device_token || 'medicare-node-token-8266'}
                disabled
                style={{ background: 'var(--color-surface-2)', fontFamily: 'monospace' }}
              />
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Include this static token in your ESP8266 HTTP headers: <code>X-Device-Token</code>.
            </span>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--spacing-4)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={logout}
            style={{ color: 'var(--color-danger)' }}
          >
            <LogOut size={16} /> Logout from System
          </button>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Saving Changes...
              </span>
            ) : (
              <>
                <Save size={18} /> Save All Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

