import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiOutlineUsers,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import {
  getMentors,
  addMentor,
  updateMentor,
  deleteMentor,
  getDashboardWorkload,
} from '../services/dataService';
import AddMentor from '../components/AddMentor';
import WorkloadBar from '../components/WorkloadBar';
import Modal from '../components/Modal';

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL'];

export default function Mentors() {
  const [workload, setWorkload] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editMentor, setEditMentor] = useState(null);
  const [deletingMentor, setDeletingMentor] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [w, m] = await Promise.all([getDashboardWorkload(), getMentors()]);
      setWorkload(w);
      setMentorsList(m);
    } catch (err) {
      console.error('Failed to load mentors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filteredWorkload = useMemo(() => {
    let result = workload;
    if (deptFilter !== 'All') {
      result = result.filter((m) => m.department === deptFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => {
        const mentorMatch = m.mentor_name.toLowerCase().includes(q) || m.mentor_id.toLowerCase().includes(q);
        const menteeMatch = m.mentees.some((s) => s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q));
        return mentorMatch || menteeMatch;
      });
    }
    return result;
  }, [workload, search, deptFilter]);

  const departments = useMemo(() => {
    const depts = new Set(workload.map((m) => m.department).filter(Boolean));
    return ['All', ...depts];
  }, [workload]);

  const menteeMatchesSearch = (mentee) => {
    if (!search.trim()) return false;
    const q = search.toLowerCase();
    return mentee.name.toLowerCase().includes(q) || mentee.student_id.toLowerCase().includes(q);
  };

  const handleAdd = async (data) => {
    try { await addMentor(data); await reload(); } catch (err) { console.error(err); }
  };

  const handleEdit = async (data) => {
    if (editMentor) {
      try { await updateMentor(editMentor.mentor_id, data); setEditMentor(null); await reload(); } catch (err) { console.error(err); }
    }
  };

  const handleDelete = async () => {
    if (deletingMentor) {
      try { await deleteMentor(deletingMentor.mentor_id); setDeletingMentor(null); await reload(); } catch (err) { console.error(err); }
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  if (loading) {
    return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Loading mentors...</p></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Mentors</h1>
          <p>Manage mentor database · Search by mentor or mentee name</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <HiOutlinePlus /> Add Mentor
        </button>
      </div>

      {workload.length > 0 && (
        <div className="card mb-24">
          <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div className="flex gap-8" style={{ alignItems: 'center' }}>
                <HiOutlineMagnifyingGlass className="text-muted" />
                <input className="search-input" type="text" placeholder="Search by mentor name, faculty ID, or mentee name/PRN..."
                  value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <select className="filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              {departments.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
            </select>
          </div>
          {search.trim() && <p className="text-muted mt-8" style={{ fontSize: '12px' }}>Showing {filteredWorkload.length} of {workload.length} mentors</p>}
        </div>
      )}

      {workload.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><HiOutlineUsers /></div><h3>No mentors added yet</h3><p>Click "Add Mentor" to start building your mentor database</p></div></div>
      ) : filteredWorkload.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><HiOutlineMagnifyingGlass /></div><h3>No results found</h3><p>No mentor or mentee matches "{search}"</p></div></div>
      ) : (
        <div className="grid-2">
          {filteredWorkload.map((m) => {
            const isExpanded = expandedId === m.mentor_id;
            const searchMatchedMentee = search.trim() && !m.mentor_name.toLowerCase().includes(search.toLowerCase()) && m.mentees.some((s) => menteeMatchesSearch(s));
            const shouldShowMentees = isExpanded || searchMatchedMentee;

            return (
              <div key={m.mentor_id} className="mentor-card" onClick={() => toggleExpand(m.mentor_id)} style={{ cursor: 'pointer' }}>
                <div className="mentor-card-header">
                  <div>
                    <div className="mentor-card-name">{m.mentor_name}</div>
                    <div className="mentor-card-designation">{m.designation || 'Faculty'}</div>
                  </div>
                  <div className="flex gap-4">
                    <span className="badge badge-purple">{m.department}</span>
                    <button className="btn btn-icon btn-secondary btn-sm" onClick={(e) => {
                      e.stopPropagation();
                      const full = mentorsList.find((x) => x.mentor_id === m.mentor_id);
                      setEditMentor(full);
                    }} title="Edit"><HiOutlinePencilSquare /></button>
                    <button className="btn btn-icon btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); setDeletingMentor(m); }} title="Delete"><HiOutlineTrash /></button>
                  </div>
                </div>
                <div className="mentor-card-body"><WorkloadBar current={m.current} max={m.max} label="Mentee Capacity" showCount /></div>

                {shouldShowMentees && m.mentees.length > 0 && (
                  <div className="mentor-card-mentees animate-fade-in">
                    <h4>Assigned Mentees ({m.mentees.length})</h4>
                    {m.mentees.map((s) => (
                      <div key={s.student_id} className="mentee-item"
                        style={menteeMatchesSearch(s) ? { background: 'rgba(124, 92, 252, 0.1)', borderRadius: '6px', padding: '6px 8px' } : {}}>
                        <span style={menteeMatchesSearch(s) ? { color: '#7c5cfc', fontWeight: 600 } : {}}>{s.name}</span>
                        <span className="text-muted">{s.student_id} · Year {s.year} · Div {s.division || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {shouldShowMentees && m.mentees.length === 0 && (
                  <div className="mentor-card-mentees animate-fade-in"><p className="text-muted" style={{ fontSize: '12px', padding: '8px 0' }}>No mentees assigned yet</p></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddMentor isOpen={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd} departments={DEPARTMENTS} />
      <AddMentor isOpen={!!editMentor} onClose={() => setEditMentor(null)} onSave={handleEdit} mentor={editMentor} departments={DEPARTMENTS} />
      <Modal isOpen={!!deletingMentor} onClose={() => setDeletingMentor(null)} title="Delete Mentor?" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setDeletingMentor(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Yes, Delete</button></>}>
        <p>Are you sure you want to delete <strong>{deletingMentor?.mentor_name}</strong>? This will also remove their allocation records.</p>
      </Modal>
    </div>
  );
}