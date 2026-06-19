// ============================================
// Mentor Allocation Engine — Min Heap + Hash Map
// Time Complexity: O(S × log M)
// Space Complexity: O(S + M)
// ============================================

import MinHeap from './MinHeap.js';

/**
 * Main allocation function using Min Heap (Priority Queue) + Hash Map.
 *
 * Algorithm:
 * 1. Build Hash Maps to group students and mentors by department
 * 2. For each department, build a MinHeap of mentors (priority = workload)
 * 3. For each unallocated student, extract-min from heap → assign → re-insert
 *
 * @param {Array} students - All students
 * @param {Array} mentors - All mentors
 * @param {Array} existingAllocations - Already existing allocation records
 * @returns {{ newAllocations: Array, stats: Object }}
 */
export function allocateStudents(students, mentors, existingAllocations) {
  // ---- Step 1: Build Hash Maps ---- O(S + M + A)

  // Set of already-allocated student IDs (for 4-year persistence)
  const allocatedSet = new Set(existingAllocations.map((a) => a.student_id));

  // Map: mentor_id → current workload count
  const workloadMap = new Map();
  mentors.forEach((m) => workloadMap.set(m.mentor_id, 0));
  existingAllocations.forEach((a) => {
    if (workloadMap.has(a.mentor_id)) {
      workloadMap.set(a.mentor_id, workloadMap.get(a.mentor_id) + 1);
    }
  });

  // Map: department → [unallocated students]
  const deptStudentsMap = new Map();
  students.forEach((s) => {
    if (allocatedSet.has(s.student_id)) return; // skip already allocated
    if (!deptStudentsMap.has(s.department)) {
      deptStudentsMap.set(s.department, []);
    }
    deptStudentsMap.get(s.department).push(s);
  });

  // Map: department → [mentors]
  const deptMentorsMap = new Map();
  mentors.forEach((m) => {
    if (!deptMentorsMap.has(m.department)) {
      deptMentorsMap.set(m.department, []);
    }
    deptMentorsMap.get(m.department).push(m);
  });

  // ---- Step 2: Allocate per department using Min Heap ----

  const newAllocations = [];
  let total = 0;
  let allocated = 0;
  let skipped = allocatedSet.size;
  let failed = 0;
  const byDepartment = {};

  for (const [dept, deptStudents] of deptStudentsMap) {
    const deptMentors = deptMentorsMap.get(dept) || [];

    if (!byDepartment[dept]) {
      byDepartment[dept] = { allocated: 0, failed: 0 };
    }

    if (deptMentors.length === 0) {
      // No mentors in this department — all students fail
      failed += deptStudents.length;
      total += deptStudents.length;
      byDepartment[dept].failed += deptStudents.length;
      continue;
    }

    // Build MinHeap for this department's mentors
    // Priority = current workload (lower workload = higher priority)
    const heap = new MinHeap();
    deptMentors.forEach((m) => {
      const currentWorkload = workloadMap.get(m.mentor_id) || 0;
      if (currentWorkload < m.max_mentees) {
        heap.insert({
          mentor_id: m.mentor_id,
          mentor_name: m.mentor_name,
          max_mentees: m.max_mentees,
          workload: currentWorkload,
        });
      }
    });

    // ---- Step 3: Assign students from this department ----
    for (const student of deptStudents) {
      total++;

      if (heap.isEmpty()) {
        // All mentors at capacity
        failed++;
        byDepartment[dept].failed++;
        continue;
      }

      // Extract mentor with lowest workload — O(log M)
      const mentor = heap.extractMin();

      // Create allocation record
      newAllocations.push({
        student_id: student.student_id,
        mentor_id: mentor.mentor_id,
        allocated_on: new Date().toISOString(),
      });

      // Update workload
      mentor.workload++;
      workloadMap.set(mentor.mentor_id, mentor.workload);
      allocated++;
      byDepartment[dept].allocated++;

      // Re-insert mentor if still has capacity — O(log M)
      if (mentor.workload < mentor.max_mentees) {
        heap.insert(mentor);
      }
    }
  }

  return {
    newAllocations,
    stats: { total, allocated, skipped, failed, byDepartment },
  };
}

/**
 * Get students who don't have an allocation record yet.
 */
export function getUnallocatedStudents(students, allocations) {
  const allocatedIds = new Set(allocations.map((a) => a.student_id));
  return students.filter((s) => !allocatedIds.has(s.student_id));
}

/**
 * Get per-mentor workload breakdown with mentee details.
 */
export function getMentorWorkload(mentors, allocations, students) {
  // Build student lookup HashMap — O(S)
  const studentMap = new Map();
  students.forEach((s) => studentMap.set(s.student_id, s));

  return mentors.map((mentor) => {
    const mentorAllocs = allocations.filter((a) => a.mentor_id === mentor.mentor_id);
    const mentees = mentorAllocs
      .map((a) => {
        const s = studentMap.get(a.student_id);
        return s
          ? { student_id: s.student_id, name: s.name, year: s.year, division: s.division }
          : null;
      })
      .filter(Boolean);

    return {
      mentor_id: mentor.mentor_id,
      mentor_name: mentor.mentor_name,
      department: mentor.department,
      designation: mentor.designation,
      current: mentorAllocs.length,
      max: mentor.max_mentees,
      mentees,
    };
  });
}

/**
 * Get overall allocation statistics.
 */
export function getAllocationStats(students, mentors, allocations) {
  const allocatedIds = new Set(allocations.map((a) => a.student_id));
  const allocatedCount = students.filter((s) => allocatedIds.has(s.student_id)).length;

  const byDepartment = {};
  const allDepts = new Set([
    ...students.map((s) => s.department),
    ...mentors.map((m) => m.department),
  ]);

  allDepts.forEach((dept) => {
    const deptStudents = students.filter((s) => s.department === dept);
    const deptMentors = mentors.filter((m) => m.department === dept);
    const deptAllocated = deptStudents.filter((s) => allocatedIds.has(s.student_id)).length;

    byDepartment[dept] = {
      students: deptStudents.length,
      mentors: deptMentors.length,
      allocated: deptAllocated,
      pending: deptStudents.length - deptAllocated,
    };
  });

  return {
    totalStudents: students.length,
    totalMentors: mentors.length,
    allocated: allocatedCount,
    pending: students.length - allocatedCount,
    byDepartment,
  };
}

/**
 * Get enriched allocation details (joined with student + mentor data).
 */
export function getAllocationDetails(students, mentors, allocations) {
  const studentMap = new Map();
  students.forEach((s) => studentMap.set(s.student_id, s));

  const mentorMap = new Map();
  mentors.forEach((m) => mentorMap.set(m.mentor_id, m));

  return allocations
    .map((a) => {
      const s = studentMap.get(a.student_id);
      const m = mentorMap.get(a.mentor_id);
      if (!s || !m) return null;
      return {
        student_id: s.student_id,
        student_name: s.name,
        department: s.department,
        year: s.year,
        division: s.division,
        mentor_id: m.mentor_id,
        mentor_name: m.mentor_name,
        allocated_on: a.allocated_on,
      };
    })
    .filter(Boolean);
}
