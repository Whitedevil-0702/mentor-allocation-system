import { useState, useEffect } from 'react';
import Modal from './Modal';

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL'];

export default function AddMentor({ isOpen, onClose, onSave, mentor = null, departments = DEPARTMENTS }) {
  const [form, setForm] = useState({
    mentor_name: '',
    department: departments[0] || '',
    designation: '',
    email: '',
    max_mentees: 30,
  });

  useEffect(() => {
    if (mentor) {
      setForm({
        mentor_name: mentor.mentor_name || '',
        department: mentor.department || departments[0] || '',
        designation: mentor.designation || '',
        email: mentor.email || '',
        max_mentees: mentor.max_mentees || 30,
      });
    } else {
      setForm({
        mentor_name: '',
        department: departments[0] || '',
        designation: '',
        email: '',
        max_mentees: 30,
      });
    }
  }, [mentor, isOpen, departments]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.mentor_name.trim() || !form.department) return;
    onSave({
      ...form,
      max_mentees: Number(form.max_mentees) || 30,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mentor ? 'Edit Mentor' : 'Add Mentor'}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {mentor ? 'Save Changes' : 'Add Mentor'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Mentor Name *</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Dr. Aditi Sharma"
            value={form.mentor_name}
            onChange={(e) => handleChange('mentor_name', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Department *</label>
          <select
            className="form-select"
            value={form.department}
            onChange={(e) => handleChange('department', e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Designation</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Professor, Assistant Professor"
            value={form.designation}
            onChange={(e) => handleChange('designation', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="e.g. aditi@university.edu"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Max Mentees (Capacity) *</label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="100"
            value={form.max_mentees}
            onChange={(e) => handleChange('max_mentees', e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
}