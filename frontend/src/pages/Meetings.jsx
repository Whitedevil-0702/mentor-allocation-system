import { useState, useEffect, useCallback } from 'react';
import { HiOutlineCalendarDays, HiOutlinePlus, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi2';
import { getAllMeetings, scheduleMeeting, updateMeeting, deleteMeeting, getDashboardWorkload } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import MeetingCard from '../components/MeetingCard';
import MeetingForm from '../components/MeetingForm';
import Modal from '../components/Modal';

export default function Meetings() {
  const { role, mentorId } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [deletingMeeting, setDeletingMeeting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [m, w] = await Promise.all([getAllMeetings(), getDashboardWorkload()]);
      // Filter by mentor if role is mentor
      const filtered = role === 'mentor' && mentorId ? m.filter((mt) => mt.mentor_id === mentorId) : m;
      setMeetings(filtered);
      // Get mentees for this mentor (for the form dropdown)
      if (mentorId) {
        const myWorkload = w.find((wl) => wl.mentor_id === mentorId);
        setMentees(myWorkload ? myWorkload.mentees : []);
      } else {
        // Admin: collect all mentees from all mentors
        const all = w.flatMap((wl) => wl.mentees);
        setMentees(all);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [role, mentorId]);

  useEffect(() => { reload(); }, [reload]);

  const scheduled = meetings.filter((m) => m.status === 'scheduled');
  const completed = meetings.filter((m) => m.status === 'completed');

  const statuses = ['All', 'scheduled', 'completed', 'cancelled'];
  const displayed = statusFilter === 'All' ? meetings : meetings.filter((m) => m.status === statusFilter);
  const sorted = [...displayed].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleSchedule = async (data) => {
    try { await scheduleMeeting(data); await reload(); } catch (err) { console.error(err); }
  };

  const handleEdit = async (data) => {
    if (editMeeting) {
      try { await updateMeeting(editMeeting.meeting_id, data); setEditMeeting(null); await reload(); } catch (err) { console.error(err); }
    }
  };

  const handleComplete = async (meeting) => {
    try { await updateMeeting(meeting.meeting_id, { status: 'completed' }); await reload(); } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (deletingMeeting) {
      try { await deleteMeeting(deletingMeeting.meeting_id); setDeletingMeeting(null); await reload(); } catch (err) { console.error(err); }
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Loading meetings...</p></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Meetings</h1><p>Schedule and track mentoring sessions</p></div>
        <button className="btn btn-primary" onClick={() => setShowSchedule(true)}><HiOutlinePlus /> Schedule Meeting</button>
      </div>

      <div className="grid-3 mb-24">
        <StatCard icon={<HiOutlineCalendarDays />} label="Total Meetings" value={meetings.length} color="purple" />
        <StatCard icon={<HiOutlineClock />} label="Upcoming" value={scheduled.length} color="cyan" />
        <StatCard icon={<HiOutlineCheckCircle />} label="Completed" value={completed.length} color="green" />
      </div>

      <div className="section">
        <div className="section-header">
          <h3>All Meetings ({displayed.length})</h3>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statuses.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {sorted.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon"><HiOutlineCalendarDays /></div><h3>No meetings yet</h3><p>Click "Schedule Meeting" to create your first session</p></div></div>
        ) : (
          <div className="grid-2">
            {sorted.map((m) => (
              <MeetingCard key={m.meeting_id} meeting={m} onEdit={setEditMeeting}
                onDelete={setDeletingMeeting} onComplete={handleComplete} />
            ))}
          </div>
        )}
      </div>

      <MeetingForm isOpen={showSchedule} onClose={() => setShowSchedule(false)} onSave={handleSchedule}
        mentees={mentees} mentorId={mentorId || ''} />

      <MeetingForm isOpen={!!editMeeting} onClose={() => setEditMeeting(null)} onSave={handleEdit}
        mentees={mentees} mentorId={mentorId || ''} meeting={editMeeting} />

      <Modal isOpen={!!deletingMeeting} onClose={() => setDeletingMeeting(null)} title="Delete Meeting?" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setDeletingMeeting(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Yes, Delete</button></>}>
        <p>Are you sure you want to delete this meeting with <strong>{deletingMeeting?.student_name}</strong>?</p>
      </Modal>
    </div>
  );
}
