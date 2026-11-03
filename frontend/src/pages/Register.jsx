import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Eye, EyeOff, UserPlus, User, Mail, Lock, Phone, Users, ChevronRight } from 'lucide-react';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const INITIAL = {
  full_name: '', email: '', password: '', confirm_password: '',
  contact_number: '', patient_name: '', patient_age: '', patient_contact: '',
};

export default function Register() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirm_password) e.confirm_password = 'Please confirm password';
    else if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    if (!form.contact_number.trim()) e.contact_number = 'Contact number is required';
    if (!form.patient_name.trim()) e.patient_name = 'Patient name is required';
    if (!form.patient_age) e.patient_age = 'Patient age is required';
    else if (parseInt(form.patient_age) < 1 || parseInt(form.patient_age) > 120) e.patient_age = 'Enter a valid age';
    if (!form.patient_contact.trim()) e.patient_contact = 'Patient contact is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        contact_number: form.contact_number,
        patient_name: form.patient_name,
        patient_age: parseInt(form.patient_age),
        patient_contact: form.patient_contact,
      });
      authLogin(res.data.user, res.data.token);
      toast.success('Registration successful! Welcome to MediCare Monitor.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      if (msg.toLowerCase().includes('email')) setErrors(prev => ({ ...prev, email: msg }));
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', icon: Icon, placeholder, extra }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', pointerEvents: 'none',
          }}>
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          value={form[name]}
          onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          className={`form-input ${errors[name] ? 'error' : ''}`}
          style={{ paddingLeft: Icon ? 40 : undefined, paddingRight: extra ? 40 : undefined }}
        />
        {extra && (
          <button type="button" onClick={extra.action} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
          }}>
            {extra.icon}
          </button>
        )}
      </div>
      {errors[name] && <span className="form-error">{errors[name]}</span>}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg)',
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* Left Panel */}
      <div style={{
        width: 420, flexShrink: 0,
        background: 'linear-gradient(160deg, #0E7490 0%, #155E75 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem 2.5rem',
      }} className="hide-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={22} color="white" fill="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem' }}>MediCare Monitor</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>IoT Medicine System</p>
          </div>
        </div>
        <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.75rem', marginBottom: '1rem', lineHeight: 1.3 }}>
          Create your caretaker account
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          Register once and manage your patient's medicine schedule remotely with real-time alerts and confirmation tracking.
        </p>
        {['Register caretaker & patient', 'Schedule morning & night medicines', 'Get Telegram alerts on missed doses', 'Monitor via live dashboard'].map((item) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronRight size={12} color="white" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>{item}</p>
          </div>
        ))}
      </div>

      {/* Right Form */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Create Account</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Caretaker Section */}
            <div style={{
              background: 'var(--color-surface-2)', borderRadius: 12,
              padding: '1.5rem', marginBottom: '1.25rem',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <User size={16} color="var(--color-primary)" />
                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Caretaker Information</h3>
              </div>
              <Field label="Full Name" name="full_name" icon={User} placeholder="Your full name" />
              <Field label="Email Address" name="email" type="email" icon={Mail} placeholder="your@email.com" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field
                  label="Password" name="password"
                  type={showPwd ? 'text' : 'password'}
                  icon={Lock} placeholder="Min. 8 characters"
                  extra={{ action: () => setShowPwd(p => !p), icon: showPwd ? <EyeOff size={16} /> : <Eye size={16} /> }}
                />
                <Field
                  label="Confirm Password" name="confirm_password"
                  type={showCPwd ? 'text' : 'password'}
                  icon={Lock} placeholder="Repeat password"
                  extra={{ action: () => setShowCPwd(p => !p), icon: showCPwd ? <EyeOff size={16} /> : <Eye size={16} /> }}
                />
              </div>
              <Field label="Contact Number" name="contact_number" icon={Phone} placeholder="+91 XXXXX XXXXX" />
            </div>

            {/* Patient Section */}
            <div style={{
              background: 'var(--color-surface-2)', borderRadius: 12,
              padding: '1.5rem', marginBottom: '1.5rem',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Users size={16} color="var(--color-primary)" />
                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Patient Information</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                <Field label="Patient Name" name="patient_name" icon={User} placeholder="Patient's full name" />
                <div className="form-group" style={{ width: 90 }}>
                  <label className="form-label">Age</label>
                  <input
                    type="number" min="1" max="120"
                    value={form.patient_age}
                    onChange={e => set('patient_age', e.target.value)}
                    placeholder="Age"
                    className={`form-input ${errors.patient_age ? 'error' : ''}`}
                  />
                  {errors.patient_age && <span className="form-error">{errors.patient_age}</span>}
                </div>
              </div>
              <Field label="Patient Contact" name="patient_contact" icon={Phone} placeholder="+91 XXXXX XXXXX" />
            </div>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Creating Account...
                </span>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
