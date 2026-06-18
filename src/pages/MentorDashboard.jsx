import { useState, useEffect } from 'react';
import {
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { getMentors, getStudents, getAllocations } from '../services/dataService';
import { getMentorWorkload } from '../services/mentorAllocation';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';

export default function MentorDashboard() {
  const { mentorId, mentorName } = useAuth();
  const [mentorData, setMentorData] = useState(null);

  useEffect(() => {
    if (!mentorId) return;
    const mentors = getMentors();
    const students = getStudents();
    const allocations = getAllocations();
    const workload = getMentorWorkload(mentors, allocations, students);
    const mine = workload.find((m) => m.mentor_id === mentorId);
    setMentorData(mine || null);
  }, [mentorId]);

  if (!mentorId) {
    return (
      <div className="animate-fade-in">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><HiOutlineUserGroup /></div>
            <h3>No Mentor Selected</h3>
            <p>Please select your mentor profile from the sidebar dropdown to view your mentees.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!mentorData) {
    return (
      <div className="animate-fade-in">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><HiOutlineUserGroup /></div>
            <h3>Mentor Not Found</h3>
            <p>The selected mentor profile could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'student_id', label: 'Student ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'year', label: 'Year', sortable: true },
    { key: 'division', label: 'Division', sortable: true },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Mentees</h1>
          <p>{mentorName || mentorData.mentor_name} · {mentorData.department}</p>
        </div>
      </div>

      <div className="grid-3 mb-24">
        <StatCard
          icon={<HiOutlineUserGroup />}
          label="Total Mentees"
          value={mentorData.current}
          color="cyan"
        />
        <StatCard
          icon={<HiOutlineCheckCircle />}
          label="Capacity Remaining"
          value={mentorData.max - mentorData.current}
          color="green"
        />
        <StatCard
          icon={<HiOutlineAcademicCap />}
          label="Department"
          value={mentorData.department}
          color="purple"
        />
      </div>

      <div className="section">
        <DataTable
          columns={columns}
          data={mentorData.mentees}
          searchable
          searchPlaceholder="Search mentees..."
          pagination
          pageSize={15}
          emptyMessage="No mentees assigned to you yet"
          emptyIcon={<HiOutlineUserGroup />}
        />
      </div>
    </div>
  );
}
