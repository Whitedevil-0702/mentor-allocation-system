import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineAcademicCap, HiOutlineCheckCircle,
  HiOutlineExclamationTriangle, HiOutlineTrash,
} from 'react-icons/hi2';
import { getStudents, addStudents, clearStudents, getAllocationDetails, getScores } from '../services/dataService';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import CSVImport from '../components/CSVImport';
import Modal from '../components/Modal';
import RiskBadge from '../components/RiskBadge';

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
  const [allocationMap, setAllocationMap] = useState({});
  const [scoreMap, setScoreMap] = useState({});
  const [allocatedCount, setAllocatedCount] = useState(0);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [s, details, scores] = await Promise.all([
        getStudents(), getAllocationDetails(),
        getScores().catch(() => []),
      ]);
      setStudents(s);
      const aMap = {};
      details.forEach((a) => { aMap[a.student_id] = a.mentor_name; });
      setAllocationMap(aMap);
      setAllocatedCount(s.filter((st) => aMap[st.student_id]).length);

      const sMap = {};
      scores.forEach((sc) => { sMap[sc.student_id] = { score: sc.score, riskBand: sc.riskBand }; });
      setScoreMap(sMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const departments = ['All', ...new Set(students.map((s) => s.department).filter(Boolean))];
  const filteredStudents = deptFilter === 'All' ? students : students.filter((s) => s.department === deptFilter);

  const tableData = filteredStudents.map((s) => ({
    ...s,
    mentor: allocationMap[s.student_id] || '—',
    score: scoreMap[s.student_id]?.score ?? '—',
    riskBand: scoreMap[s.student_id]?.riskBand || null,
  }));

  const columns = [
    { key: 'student_id', label: 'Student ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'year', label: 'Year', sortable: true },
    { key: 'score', label: 'Score', sortable: true, render: (val) => <strong>{val}</strong> },
    { key: 'riskBand', label: 'Risk', sortable: true, render: (val) => val ? <RiskBadge band={val} size="sm" /> : <span className="text-muted">—</span> },
    { key: 'mentor', label: 'Mentor', sortable: true, render: (val) => <span className={val === '—' ? 'text-muted' : 'text-success'}>{val}</span> },
  ];

  const handleImport = async (data) => {
    try { await addStudents(data); await reload(); } catch (err) { console.error(err); }
  };

  const handleClear = async () => {
    try { await clearStudents(); setShowClearModal(false); await reload(); } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Loading students...</p></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header"><div className="page-header-left"><h1>Students</h1><p>Import student data from ERP</p></div></div>

      <div className="grid-3 mb-24">
        <StatCard icon={<HiOutlineAcademicCap />} label="Total Students" value={students.length} color="cyan" />
        <StatCard icon={<HiOutlineCheckCircle />} label="Allocated" value={allocatedCount} color="green" />
        <StatCard icon={<HiOutlineExclamationTriangle />} label="Unallocated" value={students.length - allocatedCount} color="amber" />
      </div>

      <div className="section">
        <CSVImport title="Import Students from ERP (CSV)" expectedColumns={EXPECTED_COLUMNS} onImport={handleImport} />
      </div>

      <div className="section">
        <div className="section-header">
          <h3>Student Records ({filteredStudents.length})</h3>
          <select className="filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {departments.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
        </div>
        <DataTable columns={columns} data={tableData} searchable searchPlaceholder="Search students..."
          pagination pageSize={15} emptyMessage="No students imported yet" emptyIcon={<HiOutlineAcademicCap />}
          actions={students.length > 0 ? <button className="btn btn-danger btn-sm" onClick={() => setShowClearModal(true)}><HiOutlineTrash /> Clear All</button> : null} />
      </div>

      <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)} title="Clear All Students?" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setShowClearModal(false)}>Cancel</button><button className="btn btn-danger" onClick={handleClear}>Yes, Clear All</button></>}>
        <p>This will remove all {students.length} student records. Existing allocations will be preserved.</p>
      </Modal>
    </div>
  );
}