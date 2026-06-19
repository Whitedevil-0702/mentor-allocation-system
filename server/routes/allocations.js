import { Router } from 'express';
import {
  getStudents,
  getMentors,
  getAllocations,
  saveAllocations,
  clearAllocations,
} from '../services/dataStore.js';
import {
  allocateStudents,
  getUnallocatedStudents,
  getAllocationDetails,
} from '../services/mentorAllocation.js';

const router = Router();

// GET /api/allocations — Get all raw allocation records
router.get('/', (req, res) => {
  try {
    const allocations = getAllocations();
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/allocations/run — Run Min Heap allocation algorithm
router.post('/run', (req, res) => {
  try {
    const students = getStudents();
    const mentors = getMentors();
    const existingAllocations = getAllocations();

    // Run Min Heap + Hash Map allocation
    const result = allocateStudents(students, mentors, existingAllocations);

    // Save new allocations to disk
    if (result.newAllocations.length > 0) {
      saveAllocations(result.newAllocations);
    }

    res.json({
      success: true,
      stats: result.stats,
      newAllocations: result.newAllocations.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/allocations/details — Get enriched allocation details (joined data)
router.get('/details', (req, res) => {
  try {
    const students = getStudents();
    const mentors = getMentors();
    const allocations = getAllocations();
    const details = getAllocationDetails(students, mentors, allocations);
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/allocations/unallocated — Get students without a mentor
router.get('/unallocated', (req, res) => {
  try {
    const students = getStudents();
    const allocations = getAllocations();
    const unallocated = getUnallocatedStudents(students, allocations);
    res.json(unallocated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/allocations — Clear all allocations
router.delete('/', (req, res) => {
  try {
    clearAllocations();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
