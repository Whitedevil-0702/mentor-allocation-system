import { Router } from 'express';
import { getStudents, getScoreData, importScoreData, getStudentScoreData, clearScoreData } from '../services/dataStore.js';
import { computeScore, computeAllScores, getRiskSummary, getDepartmentRisk } from '../services/scoreEngine.js';

const router = Router();

// GET /api/scores — Get all students with computed scores + risk bands
router.get('/', (req, res) => {
  try {
    const students = getStudents();
    const scoreData = getScoreData();
    const studentMap = new Map();
    students.forEach((s) => studentMap.set(s.student_id, s));

    const scores = scoreData.map((sd) => {
      const student = studentMap.get(sd.student_id);
      const result = computeScore(sd);
      return {
        student_id: sd.student_id,
        student_name: student ? student.name : 'Unknown',
        department: student ? student.department : '',
        year: student ? student.year : '',
        ...result,
      };
    });

    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scores/risk-summary — Risk band distribution
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

// GET /api/scores/department-risk — Department-level risk heatmap
router.get('/department-risk', (req, res) => {
  try {
    const students = getStudents();
    const scoreData = getScoreData();
    const scores = computeAllScores(scoreData);
    const deptRisk = getDepartmentRisk(scores, students);
    res.json(deptRisk);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scores/:studentId — Single student score breakdown
router.get('/:studentId', (req, res) => {
  try {
    const sd = getStudentScoreData(req.params.studentId);
    if (!sd) {
      return res.status(404).json({ error: 'Score data not found for this student' });
    }
    const students = getStudents();
    const student = students.find((s) => s.student_id === sd.student_id);
    const result = computeScore(sd);
    res.json({
      student_id: sd.student_id,
      student_name: student ? student.name : 'Unknown',
      department: student ? student.department : '',
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scores/import — Bulk import score metrics
router.post('/import', (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Expected { data: [...] }' });
    }
    const result = importScoreData(data);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/scores — Clear all score data
router.delete('/', (req, res) => {
  try {
    clearScoreData();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
