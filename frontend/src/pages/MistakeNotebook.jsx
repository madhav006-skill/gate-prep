import React, { useEffect, useState } from 'react';
import { BookX, CheckCircle, Clock, AlertTriangle, Plus, Search, Filter, Download } from 'lucide-react';
import useMistakeStore from '../store/mistakeStore';
import MistakeCard from '../components/mistakes/MistakeCard';
import MistakeDetailModal from '../components/mistakes/MistakeDetailModal';
import MistakeManualModal from '../components/mistakes/MistakeManualModal';

const MistakeNotebook = () => {
  const { mistakes, summary, loading, filters, setFilters, fetchMistakes, fetchSummary } = useMistakeStore();
  
  const [selectedMistake, setSelectedMistake] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    fetchMistakes();
    fetchSummary();
  }, []);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mistakes, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "gate_mistake_notebook.json");
    dlAnchorElem.click();
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <BookX className="text-red-500" size={32} />
              Mistake Notebook
            </h1>
            <p className="text-gray-400 mt-2">Track, understand, and fix your recurring mistakes.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowManualModal(true)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus size={18} /> Add Manual Note
            </button>
            <button 
              onClick={handleExport}
              className="bg-gray-800 border border-gray-700 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Download size={18} /> Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-gray-400 text-sm mb-1">Total Mistakes</span>
              <span className="text-3xl font-bold">{summary.total}</span>
            </div>
            <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-blue-400 text-sm mb-1 flex items-center gap-1"><AlertTriangle size={14}/> Open</span>
              <span className="text-3xl font-bold text-blue-100">{summary.open}</span>
            </div>
            <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-emerald-400 text-sm mb-1 flex items-center gap-1"><CheckCircle size={14}/> Resolved</span>
              <span className="text-3xl font-bold text-emerald-100">{summary.resolved}</span>
            </div>
            <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-purple-400 text-sm mb-1 flex items-center gap-1"><Clock size={14}/> Repeated</span>
              <span className="text-3xl font-bold text-purple-100">{summary.repeated}</span>
            </div>
            <div className="bg-[#1A1D24] border border-red-900/30 p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-red-400 text-sm mb-1 font-bold">High Priority</span>
              <span className="text-3xl font-bold text-red-100">{summary.highPriority}</span>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter size={18} className="text-gray-500 mr-2" />
            <select 
              className="bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select 
              className="bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              value={filters.priority}
              onChange={(e) => setFilters({ priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select 
              className="bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-1.5 text-sm max-w-[150px] truncate"
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="Concept Gap">Concept Gap</option>
              <option value="Silly Mistake">Silly Mistake</option>
              <option value="Calculation Error">Calculation Error</option>
              <option value="Time Pressure">Time Pressure</option>
              <option value="Formula Forgotten">Formula Forgotten</option>
              <option value="Skipped Easy">Skipped Easy</option>
            </select>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search mistakes..." 
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-blue-500 outline-none"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading your mistake notebook...</div>
        ) : mistakes.length === 0 ? (
          <div className="bg-[#1A1D24] border border-gray-800 rounded-xl p-12 text-center">
            <BookX className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2">Your Mistake Notebook is empty</h3>
            <p className="text-gray-400 mb-6">Submit a mock test or add a manual note to start tracking mistakes.</p>
            <button 
              onClick={() => setShowManualModal(true)}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-medium inline-block"
            >
              Add Manual Mistake
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mistakes.map(mistake => (
              <MistakeCard key={mistake._id} mistake={mistake} onClick={() => setSelectedMistake(mistake)} />
            ))}
          </div>
        )}

      </div>

      {selectedMistake && (
        <MistakeDetailModal 
          mistake={selectedMistake} 
          onClose={() => setSelectedMistake(null)} 
        />
      )}

      {showManualModal && (
        <MistakeManualModal 
          onClose={() => setShowManualModal(false)} 
        />
      )}
    </div>
  );
};

export default MistakeNotebook;
