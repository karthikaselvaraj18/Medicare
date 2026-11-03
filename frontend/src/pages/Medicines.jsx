import { useState, useCallback, useEffect } from 'react';
import { Plus, Edit2, Trash2, Pill, Sun, Moon, Clock, ToggleLeft, ToggleRight, X, Save, Info } from 'lucide-react';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine } from '../services/medicineService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CATEGORIES, DAYS, LED_MAP } from '../utils/constants';
import { formatTime } from '../utils/dateUtils';

const EMPTY_FORM = {
  medicine_name: '', category: 'Morning', scheduled_time: '',
  repeat_days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  instructions: '', is_active: true,
};

function MedicineModal({ med, onClose, onSave }) {
  const [form, setForm] = useState(med || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!med?.id;

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const toggleDay = (day) => {
    setForm(f => ({ ...f, repeat_days: f.repeat_days.includes(day) ? f.repeat_days.filter(d => d !== day) : [...f.repeat_days, day] }));
  };

  const validate = () => {
    const e = {};
    if (!form.medicine_name.trim()) e.medicine_name = 'Medicine name is required';
    if (!form.scheduled_time) e.scheduled_time = 'Time is required';
    if (form.repeat_days.length === 0) e.repeat_days = 'Select at least one day';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form, led_pin: LED_MAP[form.category] || 'N/A' };
      if (isEdit) await updateMedicine(med.id, payload);
      else await createMedicine(payload);
      toast.success(isEdit ? 'Medicine updated!' : 'Medicine added!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save medicine.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Medicine' : 'Add Medicine'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Medicine Name *</label>
            <input value={form.medicine_name} onChange={e => set('medicine_name', e.target.value)} className={`form-input ${errors.medicine_name ? 'error' : ''}`} placeholder="e.g. Metformin 500mg" />
            {errors.medicine_name && <span className="form-error">{errors.medicine_name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="form-input">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Scheduled Time *</label>
              <input type="time" value={form.scheduled_time} onChange={e => set('scheduled_time', e.target.value)} className={`form-input ${errors.scheduled_time ? 'error' : ''}`} />
              {errors.scheduled_time && <span className="form-error">{errors.scheduled_time}</span>}
            </div>
          </div>

          {/* LED pin info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.875rem', background: 'var(--color-info-light)', borderRadius: 8, marginBottom: '1rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-info)' }}>
            <Info size={13} />
            {form.category === 'Morning' ? 'D6 (Morning LED) will blink for this reminder.' : form.category === 'Night' ? 'D7 (Night LED) will blink for this reminder.' : 'No dedicated LED for Other category.'}
          </div>

          <div className="form-group">
            <label className="form-label">Repeat Days *</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)} style={{ padding: '0.3rem 0.625rem', borderRadius: 6, fontSize: 'var(--font-size-xs)', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: form.repeat_days.includes(day) ? 'var(--color-primary)' : 'var(--color-border)', background: form.repeat_days.includes(day) ? 'var(--color-primary)' : 'var(--color-surface)', color: form.repeat_days.includes(day) ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.15s' }}>
                  {day}
                </button>
              ))}
            </div>
            {errors.repeat_days && <span className="form-error">{errors.repeat_days}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Instructions / Notes</label>
            <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)} className="form-input" rows={2} placeholder="e.g. Take after food" style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: '1.5rem' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Active</p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Inactive schedules are skipped by the device</p>
            </div>
            <button type="button" onClick={() => set('is_active', !form.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.is_active ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              {form.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Saving...</span> : <><Save size={16} />Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getMedicines();
      setMedicines(res.data || []);
    } catch { toast.error('Failed to load medicines.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine schedule?')) return;
    try { await deleteMedicine(id); toast.success('Deleted.'); load(); }
    catch { toast.error('Failed to delete.'); }
  };

  const handleSave = () => { setShowModal(false); setEditing(null); load(); };

  if (loading) return <LoadingSpinner size={36} />;

  const morning = medicines.filter(m => m.category === 'Morning');
  const night   = medicines.filter(m => m.category === 'Night');
  const other   = medicines.filter(m => m.category === 'Other');

  const MedCard = ({ med }) => (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-3)', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: med.category === 'Morning' ? 'var(--color-warning-light)' : med.category === 'Night' ? 'var(--color-info-light)' : 'var(--color-upcoming-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {med.category === 'Morning' ? <Sun size={20} color="var(--color-warning)" /> : med.category === 'Night' ? <Moon size={20} color="var(--color-info)" /> : <Pill size={20} color="var(--color-upcoming)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{med.medicine_name}</p>
          <span style={{ fontSize: 'var(--font-size-xs)', padding: '0.1rem 0.5rem', borderRadius: 999, background: med.is_active ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: med.is_active ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {med.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}><Clock size={11} />{formatTime(med.scheduled_time)}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>LED: {med.led_pin || LED_MAP[med.category] || '—'}</span>
          {med.instructions && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{med.instructions}</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {(typeof med.repeat_days === 'string' ? JSON.parse(med.repeat_days) : med.repeat_days || []).map(d => (
            <span key={d} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{d}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => { setEditing(med); setShowModal(true); }} className="btn btn-secondary btn-sm"><Edit2 size={13} />Edit</button>
        <button onClick={() => handleDelete(med.id)} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
      </div>
    </div>
  );

  const Section = ({ title, items, icon: Icon, color }) => (
    <div className="card" style={{ marginBottom: 'var(--spacing-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>{title}</h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{items.length} schedule{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
      {items.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'center', padding: 'var(--spacing-6)' }}>No {title.toLowerCase()} schedules added.</p>
        : items.map(m => <MedCard key={m.id} med={m} />)}
    </div>
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicine Schedules</h1>
          <p className="page-subtitle">Manage morning and night medicine reminders</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={16} />Add Medicine
        </button>
      </div>

      {/* LED mapping info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
        {[
          { label: 'Morning LED', pin: 'D6 (GPIO12)', color: 'var(--color-warning)', Icon: Sun },
          { label: 'Night LED',   pin: 'D7 (GPIO13)', color: 'var(--color-info)',    Icon: Moon },
        ].map(({ label, pin, color, Icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <Icon size={20} color={color} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{label}</p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>ESP8266 Pin: {pin}</p>
            </div>
          </div>
        ))}
      </div>

      <Section title="Morning Medicines" items={morning} icon={Sun}  color="var(--color-warning)"  />
      <Section title="Night Medicines"   items={night}   icon={Moon} color="var(--color-info)"    />
      {other.length > 0 && <Section title="Other Medicines" items={other} icon={Pill} color="var(--color-upcoming)" />}

      {showModal && <MedicineModal med={editing} onClose={() => { setShowModal(false); setEditing(null); }} onSave={handleSave} />}
    </div>
  );
}

