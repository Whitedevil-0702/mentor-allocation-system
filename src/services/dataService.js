// ============================================
// Data Service — localStorage CRUD layer
// All data persistence goes through this module
// ============================================

const KEYS = {
  MENTORS: 'mas_mentors',
  STUDENTS: 'mas_students',
  ALLOCATIONS: 'mas_allocations',
};

// --- Helpers ---

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId(prefix, items) {
  const nums = items
    .map((i) => parseInt(i[`${prefix.toLowerCase()}_id`]?.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

// ============================================
// MENTORS
// ============================================

export function getMentors() {
  return load(KEYS.MENTORS);
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
  save(KEYS.MENTORS, mentors);
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
  save(KEYS.MENTORS, mentors);
  return mentors[idx];
}

export function deleteMentor(mentorId) {
  const mentors = getMentors().filter((m) => m.mentor_id !== mentorId);
  save(KEYS.MENTORS, mentors);
  // Also remove allocations for this mentor
  const allocs = getAllocations().filter((a) => a.mentor_id !== mentorId);
  save(KEYS.ALLOCATIONS, allocs);
}

// ============================================
// STUDENTS
// ============================================

export function getStudents() {
  return load(KEYS.STUDENTS);
}

export function importStudents(studentsArray) {
  // Replace all students with new array
  const cleaned = studentsArray.map((s) => ({
    student_id: s.student_id || '',
    name: s.name || '',
    department: s.department || '',
    year: Number(s.year) || 1,
    division: s.division || '',
    semester: Number(s.semester) || 0,
    email: s.email || '',
  }));
  save(KEYS.STUDENTS, cleaned);
}

export function addStudents(studentsArray) {
  // Append students, skip duplicates by student_id
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
  save(KEYS.STUDENTS, [...existing, ...newStudents]);
}

export function clearStudents() {
  save(KEYS.STUDENTS, []);
}

// ============================================
// ALLOCATIONS
// ============================================

export function getAllocations() {
  return load(KEYS.ALLOCATIONS);
}

export function saveAllocations(newAllocations) {
  // Append new allocations to existing
  const existing = getAllocations();
  save(KEYS.ALLOCATIONS, [...existing, ...newAllocations]);
}

export function clearAllocations() {
  save(KEYS.ALLOCATIONS, []);
}

// ============================================
// UTILITY
// ============================================

export function resetAll() {
  localStorage.removeItem(KEYS.MENTORS);
  localStorage.removeItem(KEYS.STUDENTS);
  localStorage.removeItem(KEYS.ALLOCATIONS);
}
