export default function LoadingSpinner({ size = 24, color = 'var(--color-primary)' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--spacing-8)',
    }}>
      <div style={{
        width: size, height: size,
        border: `2.5px solid var(--color-border)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}
