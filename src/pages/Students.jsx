import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineTrash,
} from 'react-icons/hi2';
import {
  getStudents,
  importStudents,
  addStudents,
  clearStudents,
  getAllocations,
  getMentors,
} from '../services/dataService';
import { getAllocationDetails } from '../services/mentorAllocation';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import CSVImport from '../components/CSVImport';
import Modal from '../components/Modal';

const EXPECTED_COLUMNS = [
  { key: 'student_id', label: 'Student ID', required: true },
  { key: 'name', label: 'Student Name', required: true },
  { key: 'department', label: 'Department', required: true },
  { key: 'year', label: 'Year', required: false },
  { key: 'division', label: 'Division', required: false },
  { key: 'semester', label: 'Semester', required: false },
  { key: 'email', label: 'Email', required: false },
];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deptFilter, setDeptFilter] = useState('All');
  const [refresh, setRefresh] = useState(0);

  const reload = useCallback(() => {
    setStudents(getStudents());
    setAllocations(getAllocations());
    setMentors(getMentors());
  }, []);

  useEffect(() => { reload(); }, [reload, refresh]);

  const allocationDetails = getAllocationDetails(students, mentors, allocations);
  const allocationMap = {};
  allocationDetails.forEach((a) => {
    allocationMap[a.student_id] = a.mentor_name;
  });

  const allocatedCount = students.filter((s) => allocationMap[s.student_id]).length;

  // Department filter
  const departments = ['All', ...new Set(students.map((s) => s.department).filter(Boolean))];
  const filteredStudents = deptFilter === 'All'
    ? students
    : students.filter((s) => s.department === deptFilter);

  const tableData = filteredStudents.map((s) => ({
    ...s,
    mentor: allocationMap[s.student_id] || '—',
  }));

  const columns = [
    { key: 'student_id', label: 'Student ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'year', label: 'Year', sortable: true },
    { key: 'division', label: 'Division', sortable: true },
    {
      key: 'mentor',
      label: 'Mentor',
      sortable: true,
      render: (val) => (
        <span className={val === '—' ? 'text-muted' : 'text-success'}>{val}</span>
      ),
    },
  ];

  const handleImport = (data) => {
    addStudents(data);
    setRefresh((r) => r + 1);
  };

  const handleClear = () => {
    clearStudents();
    setShowClearModal(false);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Students</h1>
          <p>Import student data from ERP</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3 mb-24">
        <StatCard
          icon={<HiOutlineAcademicCap />}
          label="Total Students"
          value={students.length}
          color="cyan"
        />
        <StatCard
          icon={<HiOutlineCheckCircle />}
          label="Allocated"
          value={allocatedCount}
          color="green"
        />
        <StatCard
          icon={<HiOutlineExclamationTriangle />}
          label="Unallocated"
          value={students.length - allocatedCount}
          color="amber"
        />
      </div>

      {/* CSV Import */}
      <div className="section">
        <CSVImport
          title="Import Students from ERP (CSV)"
          expectedColumns={EXPECTED_COLUMNS}
          onImport={handleImport}
        />
      </div>

      {/* Student Table */}
      <div className="section">
        <div className="section-header">
          <h3>Student Records ({filteredStudents.length})</h3>
          <div className="flex gap-8">
            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={tableData}
          searchable
          searchPlaceholder="Search students..."
          pagination
          pageSize={15}
          emptyMessage="No students imported yet"
          emptyIcon={<HiOutlineAcademicCap />}
          actions={
            students.length > 0 ? (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowClearModal(true)}
              >
                <HiOutlineTrash /> Clear All
              </button>
            ) : null
          }
        />
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear All Students?"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowClearModal(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleClear}>
              Yes, Clear All
            </button>
          </>
        }
      >
        <p>This will remove all {students.length} student records. Existing allocations will still be preserved. This action cannot be undone.</p>
      </Modal>
    </div>
  );
}