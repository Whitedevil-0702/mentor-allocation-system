export default function WorkloadBar({ current, max, label, showCount = true }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const color = pct < 60 ? 'green' : pct < 85 ? 'amber' : 'red';

  return (
    <div className="workload-container">
      {(label || showCount) && (
        <div className="workload-info">
          <span className="workload-info-label">{label || ''}</span>
          {showCount && (
            <span className="workload-info-count">
              {current} / {max}
            </span>
          )}
        </div>
      )}
      <div className="workload-bar">
        <div
          className={`workload-bar-fill ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
