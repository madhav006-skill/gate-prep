import React, { useEffect } from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';

const WeaknessRadar = () => {
  const { data, isLoading, error, isEmpty, fetchWeaknessRadar } = useAnalyticsStore();

  useEffect(() => {
    fetchWeaknessRadar();
  }, []);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navBar = (
    <nav className="flex justify-between items-center bg-[#1A1D24] py-4 px-8 border-b border-gray-800">
      <div className="text-xl font-bold text-blue-500">GATEForge</div>
      <div className="flex space-x-6">
        <Link to="/dashboard" className="text-gray-300 hover:text-white transition">Dashboard</Link>
        <Link to="/tests" className="text-gray-300 hover:text-white transition">Practice</Link>
        <Link to="/analytics" className="text-gray-300 hover:text-white transition">Analytics</Link>
        <Link to="/weakness-radar" className="text-blue-400 hover:text-blue-300 font-semibold transition">Weakness Radar <span className="ml-1 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase">AI</span></Link>
      </div>
      <div className="flex items-center space-x-4">
        {user?.role === 'admin' && (
          <Link to="/admin" className="text-purple-400 border border-purple-500/30 px-3 py-1 rounded hover:bg-purple-500/10 transition">
            Admin
          </Link>
        )}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition" title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col">
        {navBar}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-blue-500 text-xl flex items-center space-x-3">
            <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analyzing your attempts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col">
        {navBar}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl max-w-lg text-center">
            <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
            <p>Could not generate weakness report right now.</p>
            <p className="text-sm mt-2 opacity-70">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty || !data) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col">
        {navBar}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-[#1A1D24] border border-gray-800 p-10 rounded-3xl max-w-lg text-center shadow-2xl">
            <div className="w-20 h-20 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Data Available</h2>
            <p className="text-gray-400 mb-8 text-lg">Complete at least one mock test to unlock your personalized AI Weakness Radar.</p>
            <Link to="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20">
              Take a Mock Test
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { scores, marksLostBreakdown, topWeakTopics, actionItems } = data;

  const PriorityBadge = ({ priority }) => {
    const colors = {
      High: 'bg-red-500/10 text-red-500 border-red-500/20',
      Medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      Low: 'bg-green-500/10 text-green-500 border-green-500/20'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[priority]}`}>
        {priority} Priority
      </span>
    );
  };

  const MistakeBadge = ({ type }) => {
    const colors = {
      'Concept Gap': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Silly Mistake': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'Time Pressure': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Skipped Easy Question': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      'Needs Practice': 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    };
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${colors[type] || colors['Needs Practice']}`}>
        {type}
      </span>
    );
  };

  const ScoreCard = ({ title, score, colorClass, icon }) => (
    <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-bl-full ${colorClass.replace('text-', 'bg-')}`}></div>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
        <div className={`p-2 rounded-lg bg-gray-900/50 ${colorClass}`}>{icon}</div>
      </div>
      <div className="flex items-end space-x-2">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-gray-500 mb-1">/100</span>
      </div>
      <div className="w-full bg-gray-800 h-1.5 rounded-full mt-4 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 pb-20">
      {navBar}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">AI Weakness Radar</h1>
          <p className="text-gray-400 text-lg">Personalized diagnosis from your submitted mock tests.</p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <ScoreCard 
            title="GATE Readiness" 
            score={scores.readiness} 
            colorClass="text-blue-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <ScoreCard 
            title="Accuracy Score" 
            score={scores.accuracy} 
            colorClass="text-green-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <ScoreCard 
            title="Speed Score" 
            score={scores.speed} 
            colorClass="text-purple-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <ScoreCard 
            title="Concept Strength" 
            score={scores.conceptStrength} 
            colorClass="text-orange-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area: Weak Topics & Marks Breakdown */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Top Weak Areas */}
            <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Top Weak Areas
                </h2>
                <span className="text-sm text-gray-500">Based on submitted tests</span>
              </div>
              <p className="text-xs text-blue-400 mb-6 font-semibold">↳ Answers: "Student kis topic me weak hai?"</p>

              {topWeakTopics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">You don't have any weak topics yet! Great job!</div>
              ) : (
                <div className="space-y-4">
                  {topWeakTopics.map((topic, idx) => (
                    <div key={idx} className="bg-[#0F1117] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-100">{topic.topic}</h3>
                            <PriorityBadge priority={topic.priority} />
                          </div>
                          <div className="text-sm text-gray-400 mb-4">{topic.subject}</div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Accuracy</div>
                              <div className="text-gray-200 font-semibold">{topic.accuracy}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Avg Time</div>
                              <div className="text-gray-200 font-semibold">{Math.floor(topic.averageTime / 60)}m {topic.averageTime % 60}s</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Marks Lost</div>
                              <div className="text-red-400 font-semibold font-mono">-{topic.marksLost}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Stats</div>
                              <div className="text-gray-300 font-semibold text-sm">
                                <span className="text-green-500">{topic.correctQuestions}</span> / <span className="text-red-500">{topic.wrongQuestions}</span> / <span className="text-gray-500">{topic.skippedQuestions}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800/50">
                            <MistakeBadge type={topic.mistakeType} />
                            <span className="text-sm text-blue-400 ml-2">💡 {topic.recommendedAction}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Marks Lost Breakdown */}
            <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-1">Why you're losing marks</h2>
              <p className="text-xs text-blue-400 mb-6 font-semibold">↳ Answers: "Student marks kyu aur kitne lose kar raha hai?"</p>
              
              <div className="space-y-4">
                {[
                  { label: 'Concept Gap', value: marksLostBreakdown.conceptGap, color: 'bg-purple-500' },
                  { label: 'Silly Mistake', value: marksLostBreakdown.sillyMistake, color: 'bg-orange-500' },
                  { label: 'Time Pressure', value: marksLostBreakdown.timePressure, color: 'bg-blue-500' },
                  { label: 'Skipped Easy', value: marksLostBreakdown.skippedEasy, color: 'bg-gray-500' },
                ].map((item, idx) => {
                  const total = Object.values(marksLostBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = total === 0 ? 0 : Math.round((item.value / total) * 100);
                  
                  return (
                    <div key={idx} className="flex items-center">
                      <div className="w-32 text-sm text-gray-400">{item.label}</div>
                      <div className="flex-1 mx-4 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-red-400 font-mono font-bold">-{item.value}</span>
                        <span className="text-gray-500 text-xs ml-1">marks</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Plan & Actions */}
          <div className="space-y-6">
            
            {/* Today's Plan */}
            <div className="bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-1 relative z-10 flex items-center">
                Today's Action Plan
              </h2>
              <p className="text-xs text-blue-300 mb-6 font-semibold relative z-10">↳ Answers: "Aaj improve karne ke liye kya karna chahiye?"</p>
              
              <ul className="space-y-4 relative z-10">
                {actionItems.map((action, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-blue-400 text-xs font-bold">{idx + 1}</span>
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Take Action</h3>
              <div className="space-y-3">
                <button disabled className="group w-full flex items-center justify-between p-3 rounded-xl bg-[#0F1117] border border-gray-800 opacity-60 cursor-not-allowed">
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Create Adaptive Test
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-gray-800 px-2 py-1 rounded text-gray-400">Soon</span>
                </button>
                <button disabled className="group w-full flex items-center justify-between p-3 rounded-xl bg-[#0F1117] border border-gray-800 opacity-60 cursor-not-allowed">
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Add to Revision
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-gray-800 px-2 py-1 rounded text-gray-400">Soon</span>
                </button>
                <button disabled className="group w-full flex items-center justify-between p-3 rounded-xl bg-[#0F1117] border border-gray-800 opacity-60 cursor-not-allowed">
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    View Mistake Notebook
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-gray-800 px-2 py-1 rounded text-gray-400">Soon</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WeaknessRadar;
