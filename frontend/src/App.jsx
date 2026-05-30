import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import ExamLayout from './pages/ExamLayout';
import ResultLayout from './pages/ResultLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import WeaknessRadar from './pages/WeaknessRadar';
import AdminPanel from './pages/AdminPanel';
import PdfImporter from './pages/admin/PdfImporter';
import TestList from './pages/TestList';
import SmartRevision from './pages/SmartRevision';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RankEstimator from './pages/RankEstimator';
import GateDatasetManager from './pages/admin/GateDatasetManager';

// Simple Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return children;
};

function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="min-h-screen bg-[#0F1117]">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:resettoken" element={<ResetPassword />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/weakness-radar" element={
          <ProtectedRoute>
            <WeaknessRadar />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <PdfImporter />
          </ProtectedRoute>
        } />
        <Route path="/tests" element={
          <ProtectedRoute>
            <TestList />
          </ProtectedRoute>
        } />
        <Route path="/revision" element={
          <ProtectedRoute>
            <SmartRevision />
          </ProtectedRoute>
        } />
        <Route path="/rank-estimator" element={
          <ProtectedRoute>
            <RankEstimator />
          </ProtectedRoute>
        } />
        <Route path="/admin/gate-dataset" element={
          <ProtectedRoute adminOnly>
            <GateDatasetManager />
          </ProtectedRoute>
        } />
        <Route path="/exam/:testId" element={
          <ProtectedRoute>
            <ExamLayout />
          </ProtectedRoute>
        } />
        <Route path="/result/:attemptId" element={
          <ProtectedRoute>
            <ResultLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
