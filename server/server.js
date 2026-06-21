// ============================================
// Express Backend — Mentor Allocation System
// Port: 5000
// ============================================

import express from 'express';
import cors from 'cors';

import mentorRoutes from './routes/mentors.js';
import studentRoutes from './routes/students.js';
import allocationRoutes from './routes/allocations.js';
import dashboardRoutes from './routes/dashboard.js';
import scoreRoutes from './routes/scores.js';
import meetingRoutes from './routes/meetings.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/mentors', mentorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/meetings', meetingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 MAS Backend running on http://localhost:${PORT}`);
  console.log(`   API endpoints available at /api/*\n`);
});
