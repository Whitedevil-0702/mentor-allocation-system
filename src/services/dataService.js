// ============================================
// Data Service — API client layer
// All functions call the Express backend via fetch()
// ============================================

const API = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================
// MENTORS
// ============================================

export async function getMentors() {
  return request('/mentors');
}

export async function addMentor(mentorData) {
  return request('/mentors', {
    method: 'POST',
    body: JSON.stringify(mentorData),
  });
}

export async function updateMentor(mentorId, updates) {
  return request(`/mentors/${mentorId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteMentor(mentorId) {
  return request(`/mentors/${mentorId}`, { method: 'DELETE' });
}

// ============================================
// STUDENTS
// ============================================

export async function getStudents() {
  return request('/students');
}

export async function addStudents(studentsArray) {
  return request('/students/import', {
    method: 'POST',
    body: JSON.stringify({ students: studentsArray }),
  });
}

export async function clearStudents() {
  return request('/students', { method: 'DELETE' });
}

// ============================================
// ALLOCATIONS
// ============================================

export async function getAllocations() {
  return request('/allocations');
}

export async function runAllocation() {
  return request('/allocations/run', { method: 'POST' });
}

export async function getAllocationDetails() {
  return request('/allocations/details');
}

export async function getUnallocatedStudents() {
  return request('/allocations/unallocated');
}

export async function clearAllocations() {
  return request('/allocations', { method: 'DELETE' });
}

// ============================================
// DASHBOARD
// ============================================

export async function getDashboardStats() {
  return request('/dashboard/stats');
}

export async function getDashboardWorkload() {
  return request('/dashboard/workload');
}
