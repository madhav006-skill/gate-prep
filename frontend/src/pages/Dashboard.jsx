import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FileText, TrendingUp, AlertTriangle, Brain, LogOut, Shield, Loader2 } from 'lucide-react';
import api from '../api/client';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    testsAttempted: 0,
    revisionDue: 0,
    weakTopics: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [attemptsRes, revisionRes] = await Promise.allSettled([
          api.get('/tests/user/my-attempts'),
          api.get('/revision/summary')
        ]);

        setStats({
          testsAttempted: attemptsRes.status === 'fulfilled' ? attemptsRes.value.data.data.length : 0,
          revisionDue: revisionRes.status === 'fulfilled' ? revisionRes.value.data.data.dueToday : 0,
          weakTopics: 0, // Will be wired to weakness radar later
          loading: false
        });
      } catch {
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center bg-[#1A1D24] py-4 px-8 border-b border-gray-800">
        <div className="text-xl font-bold text-blue-500">GATEForge</div>
        <div className="flex items-center space-x-6">
          <span className="font-medium text-gray-300">Hello, {user?.name || 'Student'}</span>
          {user?.role === 'admin' && (
            <Link to="/admin" className="px-4 py-2 bg-emerald-600/20 text-emerald-500 rounded-lg font-bold hover:bg-emerald-600/30 transition">
              Admin Panel
            </Link>
          )}
          <button onClick={handleLogout} className="flex items-center text-gray-400 hover:text-red-400 transition">
            <LogOut size={18} className="mr-1"/> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Dashboard</h1>
            <p className="text-gray-400">Targeting GATE {user?.targetYear || '2026'} in {user?.targetSubject || 'CS'}</p>
          </div>
          {user?.role === 'admin' && (
            <Link to="/admin" className="bg-blue-900/30 text-blue-400 border border-blue-800 hover:bg-blue-900/50 px-4 py-2 rounded-lg transition flex items-center">
              <Shield size={16} className="mr-2"/> Admin Panel
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#1A1D24] p-6 rounded-xl border border-gray-800 flex items-center shadow-lg">
            <div className="bg-blue-900/30 p-4 rounded-lg mr-4">
              <TrendingUp className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Daily Streak</p>
              <p className="text-2xl font-bold text-white">{user?.streak?.count || 0} Days</p>
            </div>
          </div>
          
          <div className="bg-[#1A1D24] p-6 rounded-xl border border-gray-800 flex items-center shadow-lg">
            <div className="bg-emerald-900/30 p-4 rounded-lg mr-4">
              <FileText className="text-emerald-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Tests Attempted</p>
              {stats.loading
                ? <Loader2 size={18} className="animate-spin text-gray-500 mt-1" />
                : <p className="text-2xl font-bold text-white">{stats.testsAttempted}</p>}
            </div>
          </div>

          <div className="bg-[#1A1D24] p-6 rounded-xl border border-gray-800 flex items-center shadow-lg">
            <div className="bg-purple-900/30 p-4 rounded-lg mr-4">
              <AlertTriangle className="text-purple-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Weak Topics</p>
              <p className="text-2xl font-bold text-white">{stats.weakTopics}</p>
            </div>
          </div>

          <div className="bg-[#1A1D24] p-6 rounded-xl border border-gray-800 flex items-center shadow-lg">
            <div className="bg-yellow-900/30 p-4 rounded-lg mr-4">
              <Brain className="text-yellow-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Revision Due</p>
              {stats.loading
                ? <Loader2 size={18} className="animate-spin text-gray-500 mt-1" />
                : <p className="text-2xl font-bold text-white">
                    {stats.revisionDue > 0
                      ? <span className="text-red-400">{stats.revisionDue} Qs</span>
                      : '0 Qs'}
                  </p>}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <Link to="/tests" className="block bg-gradient-to-br from-blue-900/40 to-[#1A1D24] p-6 rounded-xl border border-blue-800/50 hover:border-blue-500 transition group">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition">Take a Mock Test</h3>
            <p className="text-sm text-gray-400 mb-4">Experience the real GATE CBT interface with our full-length mock tests.</p>
            <span className="text-blue-500 text-sm font-medium">Browse Tests &rarr;</span>
          </Link>

          <Link to="/analytics" className="block bg-gradient-to-br from-emerald-900/40 to-[#1A1D24] p-6 rounded-xl border border-emerald-800/50 hover:border-emerald-500 transition group">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition">View Analytics</h3>
            <p className="text-sm text-gray-400 mb-4">Analyze your performance, track time management, and view topic heatmaps.</p>
            <span className="text-emerald-500 text-sm font-medium">View &rarr;</span>
          </Link>

          <Link to="/weakness-radar" className="block bg-gradient-to-br from-orange-900/40 to-[#1A1D24] p-6 rounded-xl border border-orange-800/50 hover:border-orange-500 transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">AI</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition">Weakness Radar</h3>
            <p className="text-sm text-gray-400 mb-4">Get personalized diagnosis and find exactly where you are losing marks.</p>
            <span className="text-orange-500 text-sm font-medium">Analyze &rarr;</span>
          </Link>

          <Link to="/revision" className="block bg-gradient-to-br from-indigo-900/40 to-[#1A1D24] p-6 rounded-xl border border-indigo-800/50 hover:border-indigo-500 transition group relative overflow-hidden">
            {stats.revisionDue > 0 && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                {stats.revisionDue} Due
              </div>
            )}
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition">Smart Revision</h3>
            <p className="text-sm text-gray-400 mb-4">Today's weak and slow questions, scheduled automatically with spaced repetition.</p>
            <span className="text-indigo-500 text-sm font-medium">Open Revision &rarr;</span>
          </Link>

          <Link to="/rank-estimator" className="block bg-gradient-to-br from-purple-900/40 to-[#1A1D24] p-6 rounded-xl border border-purple-800/50 hover:border-purple-500 transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">REAL DATA</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition">Rank Estimator</h3>
            <p className="text-sm text-gray-400 mb-4">Estimate your GATE rank using real verified historical marks-vs-rank data.</p>
            <span className="text-purple-500 text-sm font-medium">Estimate →</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
