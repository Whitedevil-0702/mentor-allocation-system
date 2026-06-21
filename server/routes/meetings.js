import { Router } from 'express';
import {
  getMeetings, addMeeting, updateMeeting, deleteMeeting,
  getMeetingsByMentor, getMeetingsByStudent,
  getStudents, getMentors,
} from '../services/dataStore.js';

const router = Router();

// GET /api/meetings — Get all meetings (with student/mentor names)
router.get('/', (req, res) => {
  try {
    const meetings = getMeetings();
    const students = getStudents();
    const mentors = getMentors();
    const studentMap = new Map();
    students.forEach((s) => studentMap.set(s.student_id, s));
    const mentorMap = new Map();
    mentors.forEach((m) => mentorMap.set(m.mentor_id, m));

    const enriched = meetings.map((m) => ({
      ...m,
      student_name: studentMap.get(m.student_id)?.name || 'Unknown',
      mentor_name: mentorMap.get(m.mentor_id)?.mentor_name || 'Unknown',
      department: studentMap.get(m.student_id)?.department || '',
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meetings — Schedule a new meeting
router.post('/', (req, res) => {
  try {
    const meeting = addMeeting(req.body);
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meetings/:id — Update meeting (notes, status, etc.)
router.put('/:id', (req, res) => {
  try {
    const meeting = updateMeeting(req.params.id, req.body);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/meetings/:id — Delete a meeting
router.delete('/:id', (req, res) => {
  try {
    deleteMeeting(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meetings/mentor/:mentorId — Meetings for a specific mentor
router.get('/mentor/:mentorId', (req, res) => {
  try {
    const meetings = getMeetingsByMentor(req.params.mentorId);
    const students = getStudents();
    const studentMap = new Map();
    students.forEach((s) => studentMap.set(s.student_id, s));

    const enriched = meetings.map((m) => ({
      ...m,
      student_name: studentMap.get(m.student_id)?.name || 'Unknown',
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
