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
  getMentors,
  getAllocations,
  getUnallocatedStudents,
  getAllocationDetails,
  getDashboardWorkload,
  runAllocation,
  clearAllocations,
} from '../services/dataService';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function Allocation() {
  const [mentors, setMentors] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [unallocated, setUnallocated] = useState([]);
  const [details, setDetails] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [m, a, u, d, w] = await Promise.all([
        getMentors(),
        getAllocations(),
        getUnallocatedStudents(),
        getAllocationDetails(),
        getDashboardWorkload(),
      ]);
      setMentors(m);
      setAllocations(a);
      setUnallocated(u);
      setDetails(d);
      setWorkload(w);
    } catch (err) {
      console.error('Failed to load allocation data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const availableMentors = workload.filter((m) => m.current < m.max);
  const departments = ['All', ...new Set(details.map((d) => d.department).filter(Boolean))];
  const filteredDetails = deptFilter === 'All' ? details : details.filter((d) => d.department === deptFilter);

  const deptWarnings = [];
  const unallocDepts = new Set(unallocated.map((s) => s.department));
  unallocDepts.forEach((dept) => {
    if (!mentors.some((m) => m.department === dept)) deptWarnings.push(dept);
  });

  const handleAllocate = async () => {
    try {
      const result = await runAllocation();
      setLastResult(result.stats);
      setShowConfirm(false);
      await reload();
    } catch (err) {
      console.error('Allocation failed:', err);
    }
  };

  const handleClear = async () => {
    try {
      await clearAllocations();
      setShowClear(false);
      setLastResult(null);
      await reload();
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  const handleExport = () => {
    if (filteredDetails.length === 0) return;
    const csvData = filteredDetails.map((d) => ({
      'Student ID': d.student_id, 'Student Name': d.student_name, 'Department': d.department,
      'Year': d.year, 'Division': d.division, 'Mentor ID': d.mentor_id, 'Mentor Name': d.mentor_name,
      'Allocated On': d.allocated_on ? new Date(d.allocated_on).toLocaleDateString() : '',
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mentor_allocation_${new Date().toISOString().split('T')[0]}.csv`;
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
    { key: 'allocated_on', label: 'Allocated On', sortable: true, render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
  ];

  if (loading) {
    return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Loading allocation data...</p></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Allocation</h1><p>Run mentor allocation and view results</p></div>
        <div className="flex gap-8">
          {allocations.length > 0 && <button className="btn btn-danger btn-sm" onClick={() => setShowClear(true)}><HiOutlineTrash /> Clear Allocations</button>}
          <button className="btn btn-primary" onClick={() => setShowConfirm(true)} disabled={unallocated.length === 0 || mentors.length === 0}>
            <HiOutlinePlayCircle /> Run Allocation
          </button>
        </div>
      </div>

      <div className="grid-3 mb-24">
        <StatCard icon={<HiOutlineExclamationTriangle />} label="Unallocated Students" value={unallocated.length} color="amber" />
        <StatCard icon={<HiOutlineCheckCircle />} label="Mentors with Capacity" value={availableMentors.length} color="green" />
        <StatCard icon={<HiOutlineClipboardDocumentList />} label="Total Allocations" value={allocations.length} color="purple" />
      </div>

      {deptWarnings.length > 0 && (
        <div className="card mb-24" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="flex gap-12" style={{ alignItems: 'flex-start' }}>
            <HiOutlineExclamationTriangle className="text-warning" style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }} />
            <div><h3 className="text-warning mb-4">Missing Mentors</h3><p>No mentors found for: <strong>{deptWarnings.join(', ')}</strong>. Add mentors for these departments first.</p></div>
          </div>
        </div>
      )}

      {lastResult && (
        <div className="card mb-24 animate-slide-up">
          <h3 className="mb-16">Allocation Results (Min Heap Algorithm)</h3>
          <div className="results-summary">
            <div className="result-badge"><span className="result-badge-dot" style={{ background: '#10b981' }} /><span>Allocated: {lastResult.allocated}</span></div>
            <div className="result-badge"><span className="result-badge-dot" style={{ background: '#f59e0b' }} /><span>Failed: {lastResult.failed}</span></div>
            <div className="result-badge"><span className="result-badge-dot" style={{ background: '#8892b0' }} /><span>Already Assigned: {lastResult.skipped}</span></div>
          </div>
          {Object.entries(lastResult.byDepartment).length > 0 && (
            <div className="mt-16"><h4 className="mb-8">By Department</h4>
              <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
                {Object.entries(lastResult.byDepartment).map(([dept, d]) => (
                  <span key={dept} className="badge badge-info">{dept}: {d.allocated} allocated, {d.failed} failed</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <h3>Allocation Records ({filteredDetails.length})</h3>
          <select className="filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {departments.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
        </div>
        <DataTable columns={columns} data={filteredDetails} searchable searchPlaceholder="Search allocations..."
          pagination pageSize={15} emptyMessage="No allocations yet. Import students and mentors, then run allocation."
          emptyIcon={<HiOutlineClipboardDocumentList />}
          actions={filteredDetails.length > 0 ? <button className="btn btn-secondary btn-sm" onClick={handleExport}><HiOutlineDocumentArrowDown /> Export CSV</button> : null} />
      </div>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Run Allocation?" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAllocate}>Yes, Allocate</button></>}>
        <p className="mb-8">This will allocate <strong>{unallocated.length}</strong> unassigned students across <strong>{availableMentors.length}</strong> mentors using <strong>Min Heap (Priority Queue)</strong> algorithm.</p>
        <p className="text-muted">Already-allocated students keep their mentor. Department matching and workload balancing rules apply.</p>
      </Modal>

      <Modal isOpen={showClear} onClose={() => setShowClear(false)} title="Clear All Allocations?" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setShowClear(false)}>Cancel</button><button className="btn btn-danger" onClick={handleClear}>Yes, Clear All</button></>}>
        <p>This will remove all {allocations.length} allocation records. You can re-run allocation after clearing.</p>
      </Modal>
    </div>
  );
}