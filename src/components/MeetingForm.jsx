import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function MeetingForm({ isOpen, onClose, onSave, mentees = [], mentorId, meeting = null }) {
  const [form, setForm] = useState({
    student_id: '',
    date: '',
    time: '',
    agenda: '',
    notes: '',
    status: 'scheduled',
  });

  useEffect(() => {
    if (meeting) {
      setForm({
        student_id: meeting.student_id || '',
        date: meeting.date || '',
        time: meeting.time || '',
        agenda: meeting.agenda || '',
        notes: meeting.notes || '',
        status: meeting.status || 'scheduled',
      });
    } else {
      setForm({ student_id: mentees[0]?.student_id || '', date: '', time: '', agenda: '', notes: '', status: 'scheduled' });
    }
  }, [meeting, isOpen, mentees]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.student_id || !form.date) return;
    onSave({ ...form, mentor_id: mentorId });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title={meeting ? 'Edit Meeting' : 'Schedule Meeting'} size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {meeting ? 'Save Changes' : 'Schedule Meeting'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Mentee *</label>
          <select className="form-select" value={form.student_id} onChange={(e) => handleChange('student_id', e.target.value)}>
            <option value="">-- Select Mentee --</option>
            {mentees.map((s) => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Time</label>
          <input className="form-input" type="time" value={form.time} onChange={(e) => handleChange('time', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Agenda</label>
          <textarea className="form-input" rows="3" placeholder="Meeting agenda..." value={form.agenda} onChange={(e) => handleChange('agenda', e.target.value)} />
        </div>
        {meeting && (
          <>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows="3" placeholder="Meeting notes..." value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
