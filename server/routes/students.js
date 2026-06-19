import { Router } from 'express';
import { getStudents, addStudents, clearStudents } from '../services/dataStore.js';

const router = Router();

// GET /api/students — Get all students
router.get('/', (req, res) => {
  try {
    const students = getStudents();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/import — Bulk import students (from parsed CSV data)
router.post('/import', (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: 'Expected { students: [...] }' });
    }
    const result = addStudents(students);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students — Clear all students
router.delete('/', (req, res) => {
  try {
    clearStudents();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
