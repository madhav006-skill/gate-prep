import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, BrainCircuit, Activity, Clock, Target } from 'lucide-react';

const Analytics = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Since we don't have a fully robust analytics backend endpoint yet,
  // we will mock the analytics data shape but structure it so it looks real.
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData({
        averageScore: 68.5,
        totalTests: 12,
        accuracy: 76,
        timePerQuestion: 1.8, // mins
        performanceTrends: [
          { name: 'Mock 1', score: 45 },
          { name: 'Mock 2', score: 52 },
          { name: 'Mock 3', score: 61 },
          { name: 'Mock 4', score: 58 },
          { name: 'Mock 5', score: 68.5 },
        ],
        subjectStrength: [
          { name: 'Data Structures', value: 85, fill: '#10B981' },
          { name: 'Algorithms', value: 70, fill: '#3B82F6' },
          { name: 'OS', value: 45, fill: '#EF4444' }, // Weak
          { name: 'Computer Networks', value: 60, fill: '#F59E0B' },
          { name: 'DBMS', value: 80, fill: '#8B5CF6' },
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-white">Loading Analytics...</div>;

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 font-sans p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-white mr-4"><ArrowLeft /></Link>
          <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1A1D24] border border-gray-800 p-6 rounded-2xl flex flex-col justify-center">
            <div className="flex items-center mb-2">
              <Target className="text-blue-500 mr-2" size={20}/> 
              <span className="text-gray-400 font-medium">Avg Score</span>
            </div>
            <span className="text-3xl font-bold text-white">{data.averageScore} <span className="text-sm text-gray-500 font-normal">/ 100</span></span>
          </div>
          
          <div className="bg-[#1A1D24] border border-gray-800 p-6 rounded-2xl flex flex-col justify-center">
            <div className="flex items-center mb-2">
              <Activity className="text-emerald-500 mr-2" size={20}/> 
              <span className="text-gray-400 font-medium">Overall Accuracy</span>
            </div>
            <span className="text-3xl font-bold text-white">{data.accuracy}%</span>
          </div>
          
          <div className="bg-[#1A1D24] border border-gray-800 p-6 rounded-2xl flex flex-col justify-center">
            <div className="flex items-center mb-2">
              <Clock className="text-purple-500 mr-2" size={20}/> 
              <span className="text-gray-400 font-medium">Avg Time / Q</span>
            </div>
            <span className="text-3xl font-bold text-white">{data.timePerQuestion} <span className="text-sm text-gray-500 font-normal">mins</span></span>
          </div>
          
          <div className="bg-[#1A1D24] border border-gray-800 p-6 rounded-2xl flex flex-col justify-center">
            <div className="flex items-center mb-2">
              <BrainCircuit className="text-yellow-500 mr-2" size={20}/> 
              <span className="text-gray-400 font-medium">Total Tests</span>
            </div>
            <span className="text-3xl font-bold text-white">{data.totalTests}</span>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trend Chart */}
          <div className="bg-[#1A1D24] border border-gray-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Score Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#60A5FA' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Strength Bar Chart */}
          <div className="bg-[#1A1D24] border border-gray-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Subject Proficiency (%)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectStrength} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" tick={{fill: '#D1D5DB'}} />
                  <RechartsTooltip cursor={{fill: '#374151', opacity: 0.4}} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}/>
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.subjectStrength.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-800/30 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center">
            <Target className="text-red-500 mr-2" size={20}/>
            Weakness Identified: Operating Systems
          </h3>
          <p className="text-gray-400 mb-4">Your accuracy in OS is only 45%. You are consistently losing marks in Process Synchronization and Virtual Memory.</p>
          <button className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition">
            Generate OS Revision Test
          </button>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
