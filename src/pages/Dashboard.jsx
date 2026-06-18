import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowUpTray,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';
import { getMentors, getStudents, getAllocations } from '../services/dataService';
import { getAllocationStats, getMentorWorkload } from '../services/mentorAllocation';
import StatCard from '../components/StatCard';
import WorkloadBar from '../components/WorkloadBar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [workload, setWorkload] = useState([]);

  useEffect(() => {
    const students = getStudents();
    const mentors = getMentors();
    const allocations = getAllocations();
    setStats(getAllocationStats(students, mentors, allocations));
    setWorkload(getMentorWorkload(mentors, allocations, students));
  }, []);

  if (!stats) return null;

  const depts = Object.entries(stats.byDepartment);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome to Mentor Allocation System</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4 mb-24">
        <StatCard
          icon={<HiOutlineAcademicCap />}
          label="Total Students"
          value={stats.totalStudents}
          color="cyan"
        />
        <StatCard
          icon={<HiOutlineUsers />}
          label="Total Mentors"
          value={stats.totalMentors}
          color="purple"
        />
        <StatCard
          icon={<HiOutlineCheckCircle />}
          label="Allocated"
          value={stats.allocated}
          color="green"
        />
        <StatCard
          icon={<HiOutlineExclamationTriangle />}
          label="Pending"
          value={stats.pending}
          color="amber"
        />
      </div>

      {/* Department Breakdown */}
      {depts.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h3>Department Breakdown</h3>
          </div>
          <div className="grid-3">
            {depts.map(([dept, d]) => (
              <div key={dept} className="dept-card">
                <div className="dept-card-name">{dept}</div>
                <div className="dept-card-stats">
                  <div className="dept-stat">
                    <span className="dept-stat-label">Students</span>
                    <span className="dept-stat-value">{d.students}</span>
                  </div>
                  <div className="dept-stat">
                    <span className="dept-stat-label">Mentors</span>
                    <span className="dept-stat-value">{d.mentors}</span>
                  </div>
                  <div className="dept-stat">
                    <span className="dept-stat-label">Allocated</span>
                    <span className="dept-stat-value text-success">{d.allocated}</span>
                  </div>
                  <div className="dept-stat">
                    <span className="dept-stat-label">Pending</span>
                    <span className="dept-stat-value text-warning">{d.pending}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentor Workload */}
      <div className="section">
        <div className="section-header">
          <h3>Mentor Workload</h3>
        </div>
        <div className="card">
          {workload.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><HiOutlineUsers /></div>
              <h3>No mentors added yet</h3>
              <p>Add mentors to see their workload distribution here</p>
            </div>
          ) : (
            <div className="flex-col gap-16">
              {workload.map((m) => (
                <div key={m.mentor_id}>
                  <WorkloadBar
                    current={m.current}
                    max={m.max}
                    label={`${m.mentor_name} (${m.department})`}
                    showCount
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="quick-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/students')}>
            <HiOutlineArrowUpTray /> Import Students
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/mentors')}>
            <HiOutlineUsers /> Manage Mentors
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/allocation')}>
            <HiOutlinePlayCircle /> Run Allocation
          </button>
        </div>
      </div>
    </div>
  );
}