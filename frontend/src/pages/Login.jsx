import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Eye, EyeOff, LogIn, Mail, Lock, Shield } from 'lucide-react';
import { login as loginApi } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) { navigate('/dashboard'); return null; }

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await loginApi({ email: form.email, password: form.password });
      authLogin(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.full_name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(msg);
      setErrors({ email: ' ', password: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        width: '100%', maxWidth: 900, borderRadius: 20,
        overflow: 'hidden', boxShadow: 'var(--shadow-xl)',
      }}>
        {/* Left Panel */}
        <div style={{
          background: 'linear-gradient(160deg, #0E7490 0%, #0F172A 100%)',
          padding: '3rem 2.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={22} color="white" fill="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>MediCare Monitor</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Caretaker Portal</p>
            </div>
          </div>

          <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.75rem', marginBottom: '1rem', lineHeight: 1.3 }}>
            Monitor your patient<br />from anywhere
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Access the dashboard to track medicine confirmations, missed reminders, and receive Telegram alerts in real time.
          </p>

          {/* Features list */}
          {[
            { icon: Shield, text: 'Secure JWT authentication' },
            { icon: Heart, text: 'Real-time patient monitoring' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color="rgba(255,255,255,0.8)" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Right Form */}
        <div style={{ background: 'var(--color-surface)', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Welcome back</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Don&apos;t have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Register here</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="your@email.com"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  style={{ paddingLeft: 40 }}
                />
              </div>
              {errors.email && errors.email.trim() && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Your password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button
                  type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in...
                </span>
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
            Your data is protected with secure authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
