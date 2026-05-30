import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Target, Activity, Award, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center py-4 sm:py-6 px-4 sm:px-8 lg:px-20 border-b border-gray-800">
        <div className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          GATEForge
        </div>
        <div className="flex space-x-3 sm:space-x-6 items-center">
          <Link to="/login" className="text-gray-300 hover:text-white transition whitespace-nowrap text-sm sm:text-base">Log in</Link>
          <Link to="/register" className="bg-blue-600 hover:bg-blue-500 px-3 sm:px-5 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base">
            Sign up <span className="hidden sm:inline">for free</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="bg-blue-900/40 text-blue-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-block border border-blue-800/50">
            GATE 2026 Preparation Platform
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Master GATE with a <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Realistic CBT Experience
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Practice Previous Year Questions in a real exam environment. Get AI-driven analytics, spot your weak areas, and improve your rank effortlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Link to="/register" className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center shadow-lg shadow-blue-600/20">
              Start Practicing Now <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link to="/dashboard" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-8 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center">
              Go to Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full"
        >
          <div className="bg-[#1A1D24] p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-colors group">
            <div className="w-14 h-14 bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="text-blue-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Authentic Interface</h3>
            <p className="text-gray-400">Experience the exact GATE UI—fullscreen mode, virtual calculator, and familiar question palette.</p>
          </div>

          <div className="bg-[#1A1D24] p-8 rounded-2xl border border-gray-800 hover:border-emerald-500/50 transition-colors group">
            <div className="w-14 h-14 bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="text-emerald-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Analytics</h3>
            <p className="text-gray-400">Track your accuracy, time spent per question, and subject-wise performance to pinpoint weak areas.</p>
          </div>

          <div className="bg-[#1A1D24] p-8 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-colors group">
            <div className="w-14 h-14 bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="text-purple-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Revision Engine</h3>
            <p className="text-gray-400">Automatically save wrong and skipped questions. Generate custom tests focused entirely on your mistakes.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Landing;
