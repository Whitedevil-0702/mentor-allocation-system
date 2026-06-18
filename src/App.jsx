import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Mentors from './pages/Mentors';
import Allocation from './pages/Allocation';
import MentorDashboard from './pages/MentorDashboard';

function AppRoutes() {
  const { role } = useAuth();

  return (
    <Layout>
      <Routes>
        {role !== 'mentor' ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/mentors" element={<Mentors />} />
            <Route path="/allocation" element={<Allocation />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/my-mentees" element={<MentorDashboard />} />
            <Route path="*" element={<Navigate to="/my-mentees" />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;