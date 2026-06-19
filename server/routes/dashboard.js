import { Router } from 'express';
import { getStudents, getMentors, getAllocations } from '../services/dataStore.js';
import { getAllocationStats, getMentorWorkload } from '../services/mentorAllocation.js';

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

export default router;
