import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HiOutlineSquares2X2,
  HiOutlineAcademicCap,
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineUserGroup,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineChartBar,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { getMentors } from '../services/dataService';

const adminLinks = [
  { to: '/', icon: <HiOutlineSquares2X2 />, label: 'Dashboard' },
  { to: '/students', icon: <HiOutlineAcademicCap />, label: 'Students' },
  { to: '/mentors', icon: <HiOutlineUsers />, label: 'Mentors' },
  { to: '/allocation', icon: <HiOutlineClipboardDocumentList />, label: 'Allocation' },
  { to: '/scores', icon: <HiOutlineChartBar />, label: 'Scores' },
  { to: '/meetings', icon: <HiOutlineCalendarDays />, label: 'Meetings' },
];

const mentorLinks = [
  { to: '/my-mentees', icon: <HiOutlineUserGroup />, label: 'My Mentees' },
  { to: '/meetings', icon: <HiOutlineCalendarDays />, label: 'Meetings' },
];

export default function Sidebar() {
  const { role, setRole, mentorId, setMentorId, setMentorName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mentors, setMentors] = useState([]);
  const location = useLocation();

  useEffect(() => {
    async function load() {
      try { const m = await getMentors(); setMentors(m); } catch {}
    }
    load();
  }, [role]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const links = role === 'mentor' ? mentorLinks : adminLinks;

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    if (newRole !== 'mentor') {
      setMentorId(null);
      setMentorName('');
    }
  };

  const handleMentorSelect = (e) => {
    const id = e.target.value;
    setMentorId(id);
    const m = mentors.find((m) => m.mentor_id === id);
    setMentorName(m ? m.mentor_name : '');
  };

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h2>MAS</h2>
          <p>Mentor Allocation System</p>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <label>Role</label>
          <select
            className="role-switcher"
            value={role}
            onChange={handleRoleChange}
          >
            <option value="admin">Admin</option>
            <option value="hod">HOD</option>
            <option value="mentor">Mentor</option>
          </select>

          {role === 'mentor' && (
            <div className="mentor-select">
              <label>Select Mentor</label>
              <select
                className="role-switcher"
                value={mentorId || ''}
                onChange={handleMentorSelect}
              >
                <option value="">-- Select --</option>
                {mentors.map((m) => (
                  <option key={m.mentor_id} value={m.mentor_id}>
                    {m.mentor_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
