import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineAcademicCap, HiOutlineUsers, HiOutlineCheckCircle,
  HiOutlineExclamationTriangle, HiOutlineArrowUpTray, HiOutlinePlayCircle,
  HiOutlineChartBar, HiOutlineCalendarDays,
} from 'react-icons/hi2';
import { getDashboardStats, getDashboardWorkload, getRiskSummary, getUpcomingMeetings } from '../services/dataService';
import StatCard from '../components/StatCard';
import WorkloadBar from '../components/WorkloadBar';
import RiskBadge from '../components/RiskBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [risk, setRisk] = useState({ green: 0, amber: 0, coral: 0, total: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, w, r, u] = await Promise.all([
          getDashboardStats(), getDashboardWorkload(),
          getRiskSummary().catch(() => ({ green: 0, amber: 0, coral: 0, total: 0 })),
          getUpcomingMeetings().catch(() => []),
        ]);
        setStats(s); setWorkload(w); setRisk(r); setUpcoming(u);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading || !stats) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Loading dashboard...</p></div>;

  const depts = Object.entries(stats.byDepartment);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Dashboard</h1><p>Welcome to Mentor Allocation System</p></div>
      </div>

      {/* Main Stats */}
      <div className="grid-4 mb-24">
        <StatCard icon={<HiOutlineAcademicCap />} label="Total Students" value={stats.totalStudents} color="cyan" />
        <StatCard icon={<HiOutlineUsers />} label="Total Mentors" value={stats.totalMentors} color="purple" />
        <StatCard icon={<HiOutlineCheckCircle />} label="Allocated" value={stats.allocated} color="green" />
        <StatCard icon={<HiOutlineExclamationTriangle />} label="Pending" value={stats.pending} color="amber" />
      </div>

      {/* Risk Distribution */}
      {risk.total > 0 && (
        <div className="section">
          <div className="section-header"><h3>Risk Distribution</h3></div>
          <div className="grid-3">
            <div className="risk-summary-card risk-summary-green" onClick={() => navigate('/scores')}>
              <div className="risk-summary-count">{risk.green}</div>
              <div className="risk-summary-label">🟢 On Track</div>
              <div className="risk-summary-bar"><div className="risk-summary-fill" style={{ width: `${risk.total ? (risk.green / risk.total * 100) : 0}%`, background: '#10b981' }} /></div>
            </div>
            <div className="risk-summary-card risk-summary-amber" onClick={() => navigate('/scores')}>
              <div className="risk-summary-count">{risk.amber}</div>
              <div className="risk-summary-label">🟡 Needs Attention</div>
              <div className="risk-summary-bar"><div className="risk-summary-fill" style={{ width: `${risk.total ? (risk.amber / risk.total * 100) : 0}%`, background: '#f59e0b' }} /></div>
            </div>
            <div className="risk-summary-card risk-summary-coral" onClick={() => navigate('/scores')}>
              <div className="risk-summary-count">{risk.coral}</div>
              <div className="risk-summary-label">🔴 At Risk</div>
              <div className="risk-summary-bar"><div className="risk-summary-fill" style={{ width: `${risk.total ? (risk.coral / risk.total * 100) : 0}%`, background: '#ef4444' }} /></div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Meetings */}
      {upcoming.length > 0 && (
        <div className="section">
          <div className="section-header"><h3>Upcoming Meetings</h3><button className="btn btn-secondary btn-sm" onClick={() => navigate('/meetings')}>View All</button></div>
          <div className="card">
            {upcoming.map((m) => (
              <div key={m.meeting_id} className="meeting-mini">
                <div className="meeting-mini-left">
                  <span className="meeting-mini-date">📅 {m.date}{m.time ? ` · 🕐 ${m.time}` : ''}</span>
                  <span className="meeting-mini-people">{m.student_name} ↔ {m.mentor_name}</span>
                </div>
                {m.agenda && <span className="text-muted meeting-mini-agenda">{m.agenda}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Breakdown */}
      {depts.length > 0 && (
        <div className="section">
          <div className="section-header"><h3>Department Breakdown</h3></div>
          <div className="grid-3">
            {depts.map(([dept, d]) => (
              <div key={dept} className="dept-card">
                <div className="dept-card-name">{dept}</div>
                <div className="dept-card-stats">
                  <div className="dept-stat"><span className="dept-stat-label">Students</span><span className="dept-stat-value">{d.students}</span></div>
                  <div className="dept-stat"><span className="dept-stat-label">Mentors</span><span className="dept-stat-value">{d.mentors}</span></div>
                  <div className="dept-stat"><span className="dept-stat-label">Allocated</span><span className="dept-stat-value text-success">{d.allocated}</span></div>
                  <div className="dept-stat"><span className="dept-stat-label">Pending</span><span className="dept-stat-value text-warning">{d.pending}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentor Workload */}
      <div className="section">
        <div className="section-header"><h3>Mentor Workload</h3></div>
        <div className="card">
          {workload.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><HiOutlineUsers /></div><h3>No mentors added yet</h3><p>Add mentors to see their workload here</p></div>
          ) : (
            <div className="flex-col gap-16">{workload.map((m) => (
              <div key={m.mentor_id}><WorkloadBar current={m.current} max={m.max} label={`${m.mentor_name} (${m.department})`} showCount /></div>
            ))}</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header"><h3>Quick Actions</h3></div>
        <div className="quick-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/students')}><HiOutlineArrowUpTray /> Import Students</button>
          <button className="btn btn-secondary" onClick={() => navigate('/mentors')}><HiOutlineUsers /> Manage Mentors</button>
          <button className="btn btn-secondary" onClick={() => navigate('/scores')}><HiOutlineChartBar /> View Scores</button>
          <button className="btn btn-secondary" onClick={() => navigate('/meetings')}><HiOutlineCalendarDays /> Meetings</button>
          <button className="btn btn-primary" onClick={() => navigate('/allocation')}><HiOutlinePlayCircle /> Run Allocation</button>
        </div>
      </div>
    </div>
  );
}