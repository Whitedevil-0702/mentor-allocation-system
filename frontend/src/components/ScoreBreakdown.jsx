import RiskBadge from './RiskBadge';

const LABELS = {
  attendance: 'Attendance',
  academic: 'Academic',
  engagement: 'Engagement',
  placement: 'Placement',
};

const WEIGHTS = {
  attendance: 0.35,
  academic: 0.35,
  engagement: 0.15,
  placement: 0.15,
};

export default function ScoreBreakdown({ score, breakdown, riskBand }) {
  if (!breakdown) return null;

  return (
    <div className="score-breakdown">
      <div className="score-breakdown-header">
        <div className="score-total">
          <span className="score-total-value">{score}</span>
          <span className="score-total-label">/ 100</span>
        </div>
        <RiskBadge band={riskBand} />
      </div>

      <div className="score-formula">
        <span className="text-muted" style={{ fontSize: '11px' }}>
          Formula: 0.35×attendance + 0.35×academic + 0.15×engagement + 0.15×placement
        </span>
      </div>

      <div className="score-bars">
        {Object.entries(breakdown).map(([key, val]) => (
          <div key={key} className="score-bar-item">
            <div className="score-bar-info">
              <span>{LABELS[key]}</span>
              <span className="text-muted">
                {val}% × {WEIGHTS[key]} = {(val * WEIGHTS[key]).toFixed(1)}
              </span>
            </div>
            <div className="score-bar-track">
              <div
                className={`score-bar-fill risk-bg-${val >= 70 ? 'green' : val >= 50 ? 'amber' : 'coral'}`}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
