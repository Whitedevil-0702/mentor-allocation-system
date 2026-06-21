// ============================================
// Score Engine — Student Success Score computation
// Formula: 0.35×attendance + 0.35×academic + 0.15×engagement + 0.15×placement
// Risk Bands: Green (≥70), Amber (50-69), Coral (<50)
// ============================================

const WEIGHTS = {
  attendance: 0.35,
  academic: 0.35,
  engagement: 0.15,
  placement: 0.15,
};

/**
 * Compute the Student Success Score for a single student.
 * All inputs should be percentages (0-100).
 */
export function computeScore(metrics) {
  const attendance = clamp(Number(metrics.attendance) || 0);
  const academic = clamp(Number(metrics.academic) || 0);
  const engagement = clamp(Number(metrics.engagement) || 0);
  const placement = clamp(Number(metrics.placement) || 0);

  const score = +(
    WEIGHTS.attendance * attendance +
    WEIGHTS.academic * academic +
    WEIGHTS.engagement * engagement +
    WEIGHTS.placement * placement
  ).toFixed(2);

  return {
    score,
    breakdown: { attendance, academic, engagement, placement },
    weights: WEIGHTS,
    riskBand: getRiskBand(score),
  };
}

/**
 * Get risk band classification.
 */
export function getRiskBand(score) {
  if (score >= 70) return 'green';
  if (score >= 50) return 'amber';
  return 'coral';
}

/**
 * Get risk band label.
 */
export function getRiskLabel(band) {
  switch (band) {
    case 'green': return 'On Track';
    case 'amber': return 'Needs Attention';
    case 'coral': return 'At Risk';
    default: return 'Unknown';
  }
}

/**
 * Compute scores for all students with score data.
 */
export function computeAllScores(scoreDataList) {
  return scoreDataList.map((sd) => ({
    student_id: sd.student_id,
    ...computeScore(sd),
  }));
}

/**
 * Get risk summary stats.
 */
export function getRiskSummary(scores) {
  const summary = { green: 0, amber: 0, coral: 0, total: scores.length };
  scores.forEach((s) => {
    const band = s.riskBand || getRiskBand(s.score);
    summary[band] = (summary[band] || 0) + 1;
  });
  return summary;
}

/**
 * Get department-level risk breakdown.
 */
export function getDepartmentRisk(scores, students) {
  const studentMap = new Map();
  students.forEach((s) => studentMap.set(s.student_id, s));

  const deptMap = {};
  scores.forEach((sc) => {
    const student = studentMap.get(sc.student_id);
    if (!student) return;
    const dept = student.department;
    if (!deptMap[dept]) {
      deptMap[dept] = { department: dept, green: 0, amber: 0, coral: 0, total: 0, avgScore: 0, totalScore: 0 };
    }
    const band = sc.riskBand || getRiskBand(sc.score);
    deptMap[dept][band]++;
    deptMap[dept].total++;
    deptMap[dept].totalScore += sc.score;
  });

  // Calculate averages
  Object.values(deptMap).forEach((d) => {
    d.avgScore = d.total > 0 ? +(d.totalScore / d.total).toFixed(2) : 0;
    delete d.totalScore;
  });

  return Object.values(deptMap);
}

function clamp(val) {
  return Math.max(0, Math.min(100, val));
}
