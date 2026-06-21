import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState('admin'); // 'admin' | 'hod' | 'mentor'
  const [mentorId, setMentorId] = useState(null);
  const [mentorName, setMentorName] = useState('');

  const value = {
    role,
    setRole,
    mentorId,
    setMentorId,
    mentorName,
    setMentorName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
