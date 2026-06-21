import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCheckCircle,
  HiOutlineExclamationTriangle, HiOutlineCalendarDays, HiOutlinePlus,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { getDashboardWorkload, getMentorMeetings, getScores, scheduleMeeting, updateMeeting } from '../services/dataService';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import RiskBadge from '../components/RiskBadge';
import MeetingCard from '../components/MeetingCard';
import MeetingForm from '../components/MeetingForm';

export default function MentorDashboard() {
  const { mentorId, mentorName } = useAuth();
  const [mentorData, setMentorData] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [scoreMap, setScoreMap] = useState({});
  const [showSchedule, setShowSchedule] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!mentorId) { setLoading(false); return; }
    try {
      const [workload, mtgs, scores] = await Promise.all([
        getDashboardWorkload(),
        getMentorMeetings(mentorId),
        getScores().catch(() => []),
      ]);
      const mine = workload.find((m) => m.mentor_id === mentorId);
      setMentorData(mine || null);
      setMeetings(mtgs);
      const sMap = {};
      scores.forEach((s) => { sMap[s.student_id] = { score: s.score, riskBand: s.riskBand }; });
      setScoreMap(sMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [mentorId]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Loading...</p></div>;

  if (!mentorId) return (
    <div className="animate-fade-in"><div className="card"><div className="empty-state"><div className="empty-state-icon"><HiOutlineUserGroup /></div><h3>No Mentor Selected</h3><p>Select your mentor profile from the sidebar dropdown.</p></div></div></div>
  );

  if (!mentorData) return (
    <div className="animate-fade-in"><div className="card"><div className="empty-state"><div className="empty-state-icon"><HiOutlineUserGroup /></div><h3>Mentor Not Found</h3><p>The selected mentor profile could not be found.</p></div></div></div>
  );

  // Enrich mentees with risk data
  const enrichedMentees = mentorData.mentees.map((s) => ({
    ...s,
    score: scoreMap[s.student_id]?.score ?? '—',
    riskBand: scoreMap[s.student_id]?.riskBand || null,
  }));

  const atRisk = enrichedMentees.filter((s) => s.riskBand === 'coral');
  const needsAttention = enrichedMentees.filter((s) => s.riskBand === 'amber');
  const scheduledMeetings = meetings.filter((m) => m.status === 'scheduled');

  const columns = [
    { key: 'student_id', label: 'Student ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'year', label: 'Year', sortable: true },
    { key: 'division', label: 'Division', sortable: true },
    { key: 'score', label: 'Score', sortable: true, render: (val) => <strong>{val}</strong> },
    { key: 'riskBand', label: 'Risk', sortable: true, render: (val) => val ? <RiskBadge band={val} size="sm" /> : <span className="text-muted">—</span> },
  ];

  const handleSchedule = async (data) => {
    try { await scheduleMeeting(data); await reload(); } catch (err) { console.error(err); }
  };

  const handleComplete = async (meeting) => {
    try { await updateMeeting(meeting.meeting_id, { status: 'completed' }); await reload(); } catch (err) { console.error(err); }
  };

  const handleEditSave = async (data) => {
    if (editMeeting) {
      try { await updateMeeting(editMeeting.meeting_id, data); setEditMeeting(null); await reload(); } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>My Mentees</h1><p>{mentorName || mentorData.mentor_name} · {mentorData.department}</p></div>
        <button className="btn btn-primary" onClick={() => setShowSchedule(true)}><HiOutlinePlus /> Schedule Meeting</button>
      </div>

      <div className="grid-4 mb-24">
        <StatCard icon={<HiOutlineUserGroup />} label="Total Mentees" value={mentorData.current} color="cyan" />
        <StatCard icon={<HiOutlineCheckCircle />} label="Capacity Left" value={mentorData.max - mentorData.current} color="green" />
        <StatCard icon={<HiOutlineExclamationTriangle />} label="At Risk" value={atRisk.length} color="red" />
        <StatCard icon={<HiOutlineCalendarDays />} label="Upcoming Meetings" value={scheduledMeetings.length} color="purple" />
      </div>

      {/* At Risk Students Alert */}
      {atRisk.length > 0 && (
        <div className="card mb-24 animate-slide-up" style={{ borderLeft: '4px solid #ef4444' }}>
          <h3 style={{ color: '#ef4444' }} className="mb-8">⚠️ At-Risk Mentees ({atRisk.length})</h3>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            {atRisk.map((s) => (
              <span key={s.student_id} className="badge badge-danger">{s.name} — Score: {s.score}</span>
            ))}
          </div>
        </div>
      )}

      {needsAttention.length > 0 && (
        <div className="card mb-24" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ color: '#f59e0b' }} className="mb-8">🟡 Needs Attention ({needsAttention.length})</h3>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            {needsAttention.map((s) => (
              <span key={s.student_id} className="badge badge-warning">{s.name} — Score: {s.score}</span>
            ))}
          </div>
        </div>
      )}

      {/* Mentee Table */}
      <div className="section">
        <div className="section-header"><h3>Mentees</h3></div>
        <DataTable columns={columns} data={enrichedMentees} searchable searchPlaceholder="Search mentees..."
          pagination pageSize={15} emptyMessage="No mentees assigned to you yet" emptyIcon={<HiOutlineUserGroup />} />
      </div>

      {/* Upcoming Meetings */}
      {scheduledMeetings.length > 0 && (
        <div className="section">
          <div className="section-header"><h3>Upcoming Meetings</h3></div>
          <div className="grid-2">
            {scheduledMeetings.map((m) => (
              <MeetingCard key={m.meeting_id} meeting={m} onEdit={setEditMeeting} onComplete={handleComplete} />
            ))}
          </div>
        </div>
      )}

      <MeetingForm isOpen={showSchedule} onClose={() => setShowSchedule(false)} onSave={handleSchedule}
        mentees={mentorData.mentees} mentorId={mentorId} />

      <MeetingForm isOpen={!!editMeeting} onClose={() => setEditMeeting(null)} onSave={handleEditSave}
        mentees={mentorData.mentees} mentorId={mentorId} meeting={editMeeting} />
    </div>
  );
}
