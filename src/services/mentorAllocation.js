// ============================================
// Mentor Allocation Engine
// Rules: department match → capacity check → workload balance
// 4-year persistence: already-allocated students are never reassigned
// ============================================

/**
 * Main allocation function.
 * Assigns unallocated students to mentors based on department + workload.
 */
export function allocateStudents(students, mentors, existingAllocations) {
  const newAllocations = [];
  const allocatedIds = new Set(existingAllocations.map((a) => a.student_id));

  // Track workload per mentor (existing + new in this run)
  const workload = {};
  mentors.forEach((m) => {
    workload[m.mentor_id] = existingAllocations.filter(
      (a) => a.mentor_id === m.mentor_id
    ).length;
  });

  let total = 0;
  let allocated = 0;
  let skipped = 0;
  let failed = 0;
  const byDepartment = {};

  students.forEach((student) => {
    // Skip already-allocated students (4-year persistence)
    if (allocatedIds.has(student.student_id)) {
      skipped++;
      return;
    }

    total++;
    const dept = student.department;

    if (!byDepartment[dept]) {
      byDepartment[dept] = { allocated: 0, failed: 0 };
    }

    // Find eligible mentors: same department + has capacity
    const eligible = mentors
      .filter(
        (m) =>
          m.department === dept &&
          (workload[m.mentor_id] || 0) < m.max_mentees
      )
      .sort((a, b) => (workload[a.mentor_id] || 0) - (workload[b.mentor_id] || 0));

    if (eligible.length > 0) {
      const mentor = eligible[0]; // lowest workload
      const record = {
        student_id: student.student_id,
        mentor_id: mentor.mentor_id,
        allocated_on: new Date().toISOString(),
      };
      newAllocations.push(record);
      workload[mentor.mentor_id] = (workload[mentor.mentor_id] || 0) + 1;
      allocated++;
      byDepartment[dept].allocated++;
    } else {
      failed++;
      byDepartment[dept].failed++;
    }
  });

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
  const studentMap = {};
  students.forEach((s) => {
    studentMap[s.student_id] = s;
  });

  return mentors.map((mentor) => {
    const mentorAllocs = allocations.filter(
      (a) => a.mentor_id === mentor.mentor_id
    );
    const mentees = mentorAllocs
      .map((a) => {
        const s = studentMap[a.student_id];
        return s
          ? {
              student_id: s.student_id,
              name: s.name,
              year: s.year,
              division: s.division,
            }
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
    const deptAllocated = deptStudents.filter((s) =>
      allocatedIds.has(s.student_id)
    ).length;

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
  const studentMap = {};
  students.forEach((s) => {
    studentMap[s.student_id] = s;
  });

  const mentorMap = {};
  mentors.forEach((m) => {
    mentorMap[m.mentor_id] = m;
  });

  return allocations
    .map((a) => {
      const s = studentMap[a.student_id];
      const m = mentorMap[a.mentor_id];
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