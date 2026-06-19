import { Router } from 'express';
import { getMentors, addMentor, updateMentor, deleteMentor } from '../services/dataStore.js';

const router = Router();

// GET /api/mentors — Get all mentors
router.get('/', (req, res) => {
  try {
    const mentors = getMentors();
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mentors — Add a new mentor
router.post('/', (req, res) => {
  try {
    const mentor = addMentor(req.body);
    res.status(201).json(mentor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/mentors/:id — Update a mentor
router.put('/:id', (req, res) => {
  try {
    const mentor = updateMentor(req.params.id, req.body);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    res.json(mentor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/mentors/:id — Delete a mentor
router.delete('/:id', (req, res) => {
  try {
    deleteMentor(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
