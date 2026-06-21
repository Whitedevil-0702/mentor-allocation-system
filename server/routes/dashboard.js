import { Router } from 'express';
import { getStudents, getMentors, getAllocations, getScoreData, getMeetings } from '../services/dataStore.js';
import { getAllocationStats, getMentorWorkload } from '../services/mentorAllocation.js';
import { computeAllScores, getRiskSummary } from '../services/scoreEngine.js';

const router = Router();

// GET /api/dashboard/stats — Overall statistics + department breakdown
router.get('/stats', (req, res) => {
  try {
    const students = getStudents();
    const mentors = getMentors();
    const allocations = getAllocations();
    const stats = getAllocationStats(students, mentors, allocations);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/workload — Per-mentor workload with mentee details
router.get('/workload', (req, res) => {
  try {
    const mentors = getMentors();
    const allocations = getAllocations();
    const students = getStudents();
    const workload = getMentorWorkload(mentors, allocations, students);
    res.json(workload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/risk-summary — Risk band distribution
router.get('/risk-summary', (req, res) => {
  try {
    const scoreData = getScoreData();
    const scores = computeAllScores(scoreData);
    const summary = getRiskSummary(scores);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/upcoming-meetings — Next 5 upcoming meetings
router.get('/upcoming-meetings', (req, res) => {
  try {
    const meetings = getMeetings();
    const students = getStudents();
    const mentors = getMentors();
    const studentMap = new Map();
    students.forEach((s) => studentMap.set(s.student_id, s));
    const mentorMap = new Map();
    mentors.forEach((m) => mentorMap.set(m.mentor_id, m));

    const today = new Date().toISOString().split('T')[0];
    const upcoming = meetings
      .filter((m) => m.status === 'scheduled' && m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, 5)
      .map((m) => ({
        ...m,
        student_name: studentMap.get(m.student_id)?.name || 'Unknown',
        mentor_name: mentorMap.get(m.mentor_id)?.mentor_name || 'Unknown',
      }));

    res.json(upcoming);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

