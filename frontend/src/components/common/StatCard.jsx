export default function StatCard({ icon: Icon, label, value, color = 'var(--color-primary)', trend }) {
  return (
    <div className="card animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-lg)',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{value ?? '—'}</p>
        {trend && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>{trend}</p>}
      </div>
    </div>
  );
}
