import { useState, useEffect, useCallback } from 'react';
import { HiOutlineChartBar, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineArrowUpTray } from 'react-icons/hi2';
import { getScores, importScoreData, getDepartmentRisk } from '../services/dataService';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import RiskBadge from '../components/RiskBadge';
import ScoreBreakdown from '../components/ScoreBreakdown';
import CSVImport from '../components/CSVImport';
import Modal from '../components/Modal';

const EXPECTED_COLUMNS = [
  { key: 'student_id', label: 'Student ID', required: true },
  { key: 'attendance', label: 'Attendance %', required: true },
  { key: 'academic', label: 'Academic %', required: true },
  { key: 'engagement', label: 'Engagement %', required: false },
  { key: 'placement', label: 'Placement %', required: false },
];

export default function Scores() {
  const [scores, setScores] = useState([]);
  const [deptRisk, setDeptRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [bandFilter, setBandFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  const reload = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([getScores(), getDepartmentRisk()]);
      setScores(s);
      setDeptRisk(d);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const riskCounts = { green: 0, amber: 0, coral: 0 };
  scores.forEach((s) => { riskCounts[s.riskBand] = (riskCounts[s.riskBand] || 0) + 1; });

  const departments = ['All', ...new Set(scores.map((s) => s.department).filter(Boolean))];
  const bands = ['All', 'green', 'amber', 'coral'];

  let filtered = scores;
  if (deptFilter !== 'All') filtered = filtered.filter((s) => s.department === deptFilter);
  if (bandFilter !== 'All') filtered = filtered.filter((s) => s.riskBand === bandFilter);

  const columns = [
    { key: 'student_id', label: 'Student ID', sortable: true },
    { key: 'student_name', label: 'Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'score', label: 'Score', sortable: true, render: (val) => <strong>{val}</strong> },
    { key: 'riskBand', label: 'Risk Band', sortable: true, render: (val) => <RiskBadge band={val} size="sm" /> },
    { key: 'breakdown', label: 'Details', render: (_, row) => (
      <button className="btn btn-sm btn-secondary" onClick={() => setSelectedStudent(row)}>View</button>
    )},
  ];

  const handleImport = async (data) => {
    try { await importScoreData(data); await reload(); } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Loading scores...</p></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Student Success Scores</h1><p>Score = 0.35×attendance + 0.35×academic + 0.15×engagement + 0.15×placement</p></div>
      </div>

      <div className="grid-3 mb-24">
        <StatCard icon={<HiOutlineCheckCircle />} label="On Track (Green)" value={riskCounts.green} color="green" />
        <StatCard icon={<HiOutlineExclamationTriangle />} label="Needs Attention (Amber)" value={riskCounts.amber} color="amber" />
        <StatCard icon={<HiOutlineExclamationTriangle />} label="At Risk (Coral)" value={riskCounts.coral} color="red" />
      </div>

      {/* Department Risk Heatmap */}
      {deptRisk.length > 0 && (
        <div className="section">
          <div className="section-header"><h3>Department Risk Heatmap</h3></div>
          <div className="grid-3">
            {deptRisk.map((d) => (
              <div key={d.department} className="dept-card">
                <div className="dept-card-name">{d.department}</div>
                <div className="dept-card-stats">
                  <div className="dept-stat"><span className="dept-stat-label">Avg Score</span><span className="dept-stat-value">{d.avgScore}</span></div>
                  <div className="dept-stat"><span className="dept-stat-label">🟢</span><span className="dept-stat-value">{d.green}</span></div>
                  <div className="dept-stat"><span className="dept-stat-label">🟡</span><span className="dept-stat-value">{d.amber}</span></div>
                  <div className="dept-stat"><span className="dept-stat-label">🔴</span><span className="dept-stat-value">{d.coral}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Import */}
      <div className="section">
        <CSVImport title="Import Score Data (CSV)" expectedColumns={EXPECTED_COLUMNS} onImport={handleImport} />
      </div>

      {/* Score Table */}
      <div className="section">
        <div className="section-header">
          <h3>All Scores ({filtered.length})</h3>
          <div className="flex gap-8">
            <select className="filter-select" value={bandFilter} onChange={(e) => setBandFilter(e.target.value)}>
              {bands.map((b) => <option key={b} value={b}>{b === 'All' ? 'All Risk Bands' : b === 'green' ? '🟢 Green' : b === 'amber' ? '🟡 Amber' : '🔴 Coral'}</option>)}
            </select>
            <select className="filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              {departments.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
            </select>
          </div>
        </div>
        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search students..."
          pagination pageSize={15} emptyMessage="No score data. Import attendance/marks CSV above." emptyIcon={<HiOutlineChartBar />} />
      </div>

      {/* Score Breakdown Modal */}
      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title={`Score Breakdown — ${selectedStudent?.student_name}`} size="sm">
        {selectedStudent && <ScoreBreakdown score={selectedStudent.score} breakdown={selectedStudent.breakdown} riskBand={selectedStudent.riskBand} />}
      </Modal>
    </div>
  );
}
