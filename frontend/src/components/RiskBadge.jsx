export default function RiskBadge({ band, size = 'md' }) {
  const labels = { green: 'On Track', amber: 'Needs Attention', coral: 'At Risk' };
  const label = labels[band] || 'N/A';

  return (
    <span className={`risk-badge risk-${band} risk-${size}`}>
      <span className="risk-dot" />
      {label}
    </span>
  );
}
