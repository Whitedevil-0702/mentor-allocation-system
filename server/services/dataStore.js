// ============================================
// Data Store — JSON file persistence layer
// Reads/writes to server/data/*.json files
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- Helpers ---

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readJSON(name) {
  const fp = filePath(name);
  try {
    if (!fs.existsSync(fp)) return [];
    const raw = fs.readFileSync(fp, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJSON(name, data) {
  const fp = filePath(name);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(prefix, items) {
  const key = `${prefix.toLowerCase()}_id`;
  const nums = items
    .map((i) => parseInt(String(i[key] || '').replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

// ============================================
// MENTORS
// ============================================

export function getMentors() {
  return readJSON('mentors');
}

export function addMentor(mentorData) {
  const mentors = getMentors();
  const mentor = {
    mentor_id: nextId('M', mentors),
    mentor_name: mentorData.mentor_name,
    department: mentorData.department,
    designation: mentorData.designation || '',
    email: mentorData.email || '',
    max_mentees: Number(mentorData.max_mentees) || 30,
    current_mentees: 0,
  };
  mentors.push(mentor);
  writeJSON('mentors', mentors);
  return mentor;
}

export function updateMentor(mentorId, updates) {
  const mentors = getMentors();
  const idx = mentors.findIndex((m) => m.mentor_id === mentorId);
  if (idx === -1) return null;
  mentors[idx] = { ...mentors[idx], ...updates };
  if (updates.max_mentees !== undefined) {
    mentors[idx].max_mentees = Number(updates.max_mentees);
  }
  writeJSON('mentors', mentors);
  return mentors[idx];
}

export function deleteMentor(mentorId) {
  const mentors = getMentors().filter((m) => m.mentor_id !== mentorId);
  writeJSON('mentors', mentors);
  // Also remove allocations for this mentor
  const allocs = getAllocations().filter((a) => a.mentor_id !== mentorId);
  writeJSON('allocations', allocs);
}

// ============================================
// STUDENTS
// ============================================

export function getStudents() {
  return readJSON('students');
}

export function addStudents(studentsArray) {
  const existing = getStudents();
  const existingIds = new Set(existing.map((s) => s.student_id));
  const newStudents = studentsArray
    .filter((s) => s.student_id && !existingIds.has(s.student_id))
    .map((s) => ({
      student_id: s.student_id || '',
      name: s.name || '',
      department: s.department || '',
      year: Number(s.year) || 1,
      division: s.division || '',
      semester: Number(s.semester) || 0,
      email: s.email || '',
    }));
  writeJSON('students', [...existing, ...newStudents]);
  return { added: newStudents.length, total: existing.length + newStudents.length };
}

export function clearStudents() {
  writeJSON('students', []);
}

// ============================================
// ALLOCATIONS
// ============================================

export function getAllocations() {
  return readJSON('allocations');
}

export function saveAllocations(newAllocations) {
  const existing = getAllocations();
  writeJSON('allocations', [...existing, ...newAllocations]);
}

export function clearAllocations() {
  writeJSON('allocations', []);
}

// ============================================
// SCORE DATA
// ============================================

export function getScoreData() {
  return readJSON('score_data');
}

export function importScoreData(dataArray) {
  const existing = getScoreData();
  const existingIds = new Set(existing.map((s) => s.student_id));

  const updates = [];
  const inserts = [];

  dataArray.forEach((sd) => {
    const entry = {
      student_id: sd.student_id || '',
      attendance: Number(sd.attendance) || 0,
      academic: Number(sd.academic) || 0,
      engagement: Number(sd.engagement) || 0,
      placement: Number(sd.placement) || 0,
      updated_at: new Date().toISOString(),
    };
    if (existingIds.has(entry.student_id)) {
      updates.push(entry);
    } else {
      inserts.push(entry);
    }
  });

  // Update existing entries
  const merged = existing.map((e) => {
    const upd = updates.find((u) => u.student_id === e.student_id);
    return upd ? { ...e, ...upd } : e;
  });

  writeJSON('score_data', [...merged, ...inserts]);
  return { updated: updates.length, inserted: inserts.length, total: merged.length + inserts.length };
}

export function getStudentScoreData(studentId) {
  const all = getScoreData();
  return all.find((s) => s.student_id === studentId) || null;
}

export function clearScoreData() {
  writeJSON('score_data', []);
}

// ============================================
// MEETINGS
// ============================================

export function getMeetings() {
  return readJSON('meetings');
}

export function addMeeting(meetingData) {
  const meetings = getMeetings();
  const meeting = {
    meeting_id: nextId('MTG', meetings),
    mentor_id: meetingData.mentor_id,
    student_id: meetingData.student_id,
    date: meetingData.date || '',
    time: meetingData.time || '',
    agenda: meetingData.agenda || '',
    notes: meetingData.notes || '',
    status: meetingData.status || 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  meetings.push(meeting);
  writeJSON('meetings', meetings);
  return meeting;
}

export function updateMeeting(meetingId, updates) {
  const meetings = getMeetings();
  const idx = meetings.findIndex((m) => m.meeting_id === meetingId);
  if (idx === -1) return null;
  meetings[idx] = { ...meetings[idx], ...updates, updated_at: new Date().toISOString() };
  writeJSON('meetings', meetings);
  return meetings[idx];
}

export function deleteMeeting(meetingId) {
  const meetings = getMeetings().filter((m) => m.meeting_id !== meetingId);
  writeJSON('meetings', meetings);
}

export function getMeetingsByMentor(mentorId) {
  return getMeetings().filter((m) => m.mentor_id === mentorId);
}

export function getMeetingsByStudent(studentId) {
  return getMeetings().filter((m) => m.student_id === studentId);
}

// ============================================
// UTILITY
// ============================================

export function resetAll() {
  writeJSON('mentors', []);
  writeJSON('students', []);
  writeJSON('allocations', []);
  writeJSON('score_data', []);
  writeJSON('meetings', []);
}
