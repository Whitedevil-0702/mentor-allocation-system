import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi2';

const STATUS_STYLES = {
  scheduled: { label: 'Scheduled', cls: 'badge-info' },
  completed: { label: 'Completed', cls: 'badge-success' },
  cancelled: { label: 'Cancelled', cls: 'badge-danger' },
};

export default function MeetingCard({ meeting, onEdit, onDelete, onComplete }) {
  const st = STATUS_STYLES[meeting.status] || STATUS_STYLES.scheduled;

  return (
    <div className={`meeting-card meeting-${meeting.status}`}>
      <div className="meeting-card-header">
        <div>
          <div className="meeting-card-title">{meeting.student_name || meeting.student_id}</div>
          <div className="meeting-card-meta">
            {meeting.mentor_name && <span>with {meeting.mentor_name}</span>}
            {meeting.department && <span> · {meeting.department}</span>}
          </div>
        </div>
        <span className={`badge ${st.cls}`}>{st.label}</span>
      </div>

      <div className="meeting-card-body">
        <div className="meeting-card-datetime">
          <span>📅 {meeting.date}</span>
          {meeting.time && <span> · 🕐 {meeting.time}</span>}
        </div>
        {meeting.agenda && (
          <div className="meeting-card-agenda">
            <strong>Agenda:</strong> {meeting.agenda}
          </div>
        )}
        {meeting.notes && (
          <div className="meeting-card-notes">
            <strong>Notes:</strong> {meeting.notes}
          </div>
        )}
      </div>

      <div className="meeting-card-actions">
        {meeting.status === 'scheduled' && onComplete && (
          <button className="btn btn-sm btn-success" onClick={() => onComplete(meeting)}>
            <HiOutlineCheckCircle /> Complete
          </button>
        )}
        {onEdit && (
          <button className="btn btn-sm btn-secondary" onClick={() => onEdit(meeting)}>
            <HiOutlinePencilSquare /> Edit
          </button>
        )}
        {onDelete && (
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(meeting)}>
            <HiOutlineTrash />
          </button>
        )}
      </div>
    </div>
  );
}
