import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import {
  HiOutlinePlayCircle,
  HiOutlineDocumentArrowDown,
  HiOutlineTrash,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';
import {
  getStudents,
  getMentors,
  getAllocations,
  saveAllocations,
  clearAllocations,
} from '../services/dataService';
import {
  allocateStudents,
  getUnallocatedStudents,
  getAllocationDetails,
  getMentorWorkload,
} from '../services/mentorAllocation';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function Allocation() {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [deptFilter, setDeptFilter] = useState('All');
  const [refresh, setRefresh] = useState(0);

  const reload = useCallback(() => {
    setStudents(getStudents());
    setMentors(getMentors());
    setAllocations(getAllocations());
  }, []);

  useEffect(() => { reload(); }, [reload, refresh]);

  const unallocated = getUnallocatedStudents(students, allocations);
  const workload = getMentorWorkload(mentors, allocations, students);
  const availableMentors = workload.filter((m) => m.current < m.max);
  const details = getAllocationDetails(students, mentors, allocations);

  // Department filter
  const departments = ['All', ...new Set(details.map((d) => d.department).filter(Boolean))];
  const filteredDetails = deptFilter === 'All'
    ? details
    : details.filter((d) => d.department === deptFilter);

  // Check warnings
  const deptWarnings = [];
  const unallocDepts = new Set(unallocated.map((s) => s.department));
  unallocDepts.forEach((dept) => {
    const hasMentor = mentors.some((m) => m.department === dept);
    if (!hasMentor) {
      deptWarnings.push(dept);
    }
  });

  const handleAllocate = () => {
    const result = allocateStudents(students, mentors, allocations);
    if (result.newAllocations.length > 0) {
      saveAllocations(result.newAllocations);
    }
    setLastResult(result.stats);
    setShowConfirm(false);
    setRefresh((r) => r + 1);
  };

  const handleClear = () => {
    clearAllocations();
    setShowClear(false);
    setLastResult(null);
    setRefresh((r) => r + 1);
  };

  const handleExport = () => {
    if (filteredDetails.length === 0) return;
    const csvData = filteredDetails.map((d) => ({
      'Student ID': d.student_id,
      'Student Name': d.student_name,
      'Department': d.department,
      'Year': d.year,
      'Division': d.division,
      'Mentor ID': d.mentor_id,
      'Mentor Name': d.mentor_name,
      'Allocated On': d.allocated_on ? new Date(d.allocated_on).toLocaleDateString() : '',
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `mentor_allocation_${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'student_id', label: 'Student ID', sortable: true },
    { key: 'student_name', label: 'Student Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'year', label: 'Year', sortable: true },
    { key: 'division', label: 'Division', sortable: true },
    { key: 'mentor_name', label: 'Mentor', sortable: true },
    {
      key: 'allocated_on',
      label: 'Allocated On',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Allocation</h1>
          <p>Run mentor allocation and view results</p>
        </div>
        <div className="flex gap-8">
          {allocations.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={() => setShowClear(true)}>
              <HiOutlineTrash /> Clear Allocations
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowConfirm(true)}
            disabled={unallocated.length === 0 || mentors.length === 0}
          >
            <HiOutlinePlayCircle /> Run Allocation
          </button>
        </div>
      </div>

      {/* Pre-allocation Summary */}
      <div className="grid-3 mb-24">
        <StatCard
          icon={<HiOutlineExclamationTriangle />}
          label="Unallocated Students"
          value={unallocated.length}
          color="amber"
        />
        <StatCard
          icon={<HiOutlineCheckCircle />}
          label="Mentors with Capacity"
          value={availableMentors.length}
          color="green"
        />
        <StatCard
          icon={<HiOutlineClipboardDocumentList />}
          label="Total Allocations"
          value={allocations.length}
          color="purple"
        />
      </div>

      {/* Warnings */}
      {deptWarnings.length > 0 && (
        <div className="card mb-24" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="flex gap-12" style={{ alignItems: 'flex-start' }}>
            <HiOutlineExclamationTriangle className="text-warning" style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 className="text-warning mb-4">Missing Mentors</h3>
              <p>
                No mentors found for: <strong>{deptWarnings.join(', ')}</strong>.
                Students in these departments cannot be allocated. Please add mentors for these departments first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Allocation Result */}
      {lastResult && (
        <div className="card mb-24 animate-slide-up">
          <h3 className="mb-16">Allocation Results</h3>
          <div className="results-summary">
            <div className="result-badge">
              <span className="result-badge-dot" style={{ background: '#10b981' }} />
              <span>Allocated: {lastResult.allocated}</span>
            </div>
            <div className="result-badge">
              <span className="result-badge-dot" style={{ background: '#f59e0b' }} />
              <span>Failed: {lastResult.failed}</span>
            </div>
            <div className="result-badge">
              <span className="result-badge-dot" style={{ background: '#8892b0' }} />
              <span>Already Assigned: {lastResult.skipped}</span>
            </div>
          </div>
          {Object.entries(lastResult.byDepartment).length > 0 && (
            <div className="mt-16">
              <h4 className="mb-8">By Department</h4>
              <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
                {Object.entries(lastResult.byDepartment).map(([dept, d]) => (
                  <span key={dept} className="badge badge-info">
                    {dept}: {d.allocated} allocated, {d.failed} failed
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Allocation Table */}
      <div className="section">
        <div className="section-header">
          <h3>Allocation Records ({filteredDetails.length})</h3>
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
          data={filteredDetails}
          searchable
          searchPlaceholder="Search allocations..."
          pagination
          pageSize={15}
          emptyMessage="No allocations yet. Import students and mentors, then run allocation."
          emptyIcon={<HiOutlineClipboardDocumentList />}
          actions={
            filteredDetails.length > 0 ? (
              <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                <HiOutlineDocumentArrowDown /> Export CSV
              </button>
            ) : null
          }
        />
      </div>

      {/* Run Allocation Confirmation */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Run Allocation?"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAllocate}>
              Yes, Allocate
            </button>
          </>
        }
      >
        <p className="mb-8">
          This will allocate <strong>{unallocated.length}</strong> unassigned students 
          across <strong>{availableMentors.length}</strong> mentors with remaining capacity.
        </p>
        <p className="text-muted">
          Already-allocated students will keep their current mentor. This follows department matching and workload balancing rules.
        </p>
      </Modal>

      {/* Clear Confirmation */}
      <Modal
        isOpen={showClear}
        onClose={() => setShowClear(false)}
        title="Clear All Allocations?"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowClear(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleClear}>
              Yes, Clear All
            </button>
          </>
        }
      >
        <p>
          This will remove all {allocations.length} allocation records. Students and mentors will not be deleted. You can re-run allocation after clearing.
        </p>
      </Modal>
    </div>
  );
}