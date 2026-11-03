import { useNavigate } from 'react-router-dom';
import { Heart, Shield, Bell, Smartphone, ArrowRight, Activity, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const FEATURES = [
  { icon: Bell, title: 'Smart Reminders', desc: 'LED & buzzer alerts at scheduled medicine times' },
  { icon: Shield, title: 'Missed Alert System', desc: 'Automatic Telegram notifications to caretakers' },
  { icon: Activity, title: 'Real-Time Dashboard', desc: 'Monitor confirmation status live from anywhere' },
  { icon: Smartphone, title: 'IoT Integration', desc: 'ESP8266 NodeMCU with physical button confirmation' },
  { icon: Users, title: 'Patient Monitoring', desc: 'Track medicine history and compliance records' },
  { icon: Heart, title: 'Healthcare Focused', desc: 'Designed for elderly patient care and dignity' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0E7490 0%, #155E75 50%, #0F172A 100%)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={22} color="white" fill="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.2 }}>MediCare Monitor</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>IoT Medicine Reminder System</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent', color: 'white',
              fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 8,
              background: 'white', color: '#0E7490',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: 900, margin: '0 auto',
        padding: '5rem 2rem 4rem',
        textAlign: 'center',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.375rem 1rem',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 999, marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <Activity size={14} color="rgba(255,255,255,0.8)" />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 500 }}>
            ECE Final Year Project — IoT Healthcare System
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 800, color: 'white', lineHeight: 1.15,
          marginBottom: '1.5rem', letterSpacing: '-0.02em',
        }}>
          Smart Medicine Reminders<br />
          <span style={{ color: '#67E8F9' }}>for Elderly Care</span>
        </h1>

        <p style={{
          fontSize: '1.125rem', color: 'rgba(255,255,255,0.7)',
          maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7,
        }}>
          An IoT-based system using ESP8266 NodeMCU to remind patients about their medicines via LED and buzzer alerts, with real-time caretaker monitoring through a web dashboard.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 2rem',
              background: 'white', color: '#0E7490',
              borderRadius: 10, fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; }}
          >
            Register as Caretaker <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.875rem 2rem',
              background: 'rgba(255,255,255,0.1)',
              color: 'white', borderRadius: 10,
              fontWeight: 600, fontSize: '1rem',
              cursor: 'pointer', transition: 'all 0.2s',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Stats Row */}
      <div style={{
        maxWidth: 800, margin: '0 auto', padding: '0 2rem 4rem',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
      }}>
        {[
          { value: '2 LEDs', label: 'Morning & Night Indicators' },
          { value: 'ESP8266', label: 'IoT Hardware Device' },
          { value: 'Telegram', label: 'Instant Miss Alerts' },
        ].map(({ value, label }) => (
          <div key={label} style={{
            textAlign: 'center', padding: '1.5rem',
            background: 'rgba(255,255,255,0.08)', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <p style={{ color: '#67E8F9', fontWeight: 700, fontSize: '1.5rem' }}>{value}</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginTop: 4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <section style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: 'white', fontWeight: 700, fontSize: '1.875rem', marginBottom: '2.5rem' }}>
            How It Works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '1.5rem',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'rgba(103,232,249,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <Icon size={22} color="#67E8F9" />
                </div>
                <h3 style={{ color: 'white', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', color: 'white', fontWeight: 700, fontSize: '1.875rem', marginBottom: '2.5rem' }}>
          Patient Confirmation Flow
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {[
            'Schedule Medicine', 'Reminder Fires', 'LED + Buzzer', 'Patient Confirms', 'Status Updated', 'Caretaker Notified'
          ].map((step, i, arr) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'rgba(103,232,249,0.15)', border: '1px solid rgba(103,232,249,0.3)',
                borderRadius: 8, padding: '0.625rem 1rem',
                color: '#67E8F9', fontSize: '0.875rem', fontWeight: 500,
              }}>
                {step}
              </div>
              {i < arr.length - 1 && <ArrowRight size={16} color="rgba(255,255,255,0.3)" />}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
      }}>
        MediCare Monitor — ECE Final Year Project | IoT-Based Medicine Reminder System
      </footer>
    </div>
  );
}
