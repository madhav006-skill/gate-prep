import React, { useState } from 'react';
import { X, Save, Edit3, Trash2, RotateCcw, CheckCircle, Clock } from 'lucide-react';
import useMistakeStore from '../../store/mistakeStore';

const CATEGORIES = [
  'Concept Gap', 'Silly Mistake', 'Calculation Error', 
  'Time Pressure', 'Question Misread', 'Formula Forgotten', 'Skipped Easy', 'Marked for Review', 'Other'
];

const MistakeDetailModal = ({ mistake, onClose }) => {
  const { updateMistake, deleteMistake } = useMistakeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    detectedCategory: mistake.detectedCategory,
    priority: mistake.priority,
    userNote: mistake.userNote || '',
    fixAction: mistake.fixAction || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateMistake(mistake._id, form);
    setSaving(false);
    setIsEditing(false);
  };

  const handleStatusToggle = async () => {
    setSaving(true);
    await updateMistake(mistake._id, { 
      status: mistake.status === 'Open' ? 'Resolved' : 'Open' 
    });
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this mistake?')) {
      setSaving(true);
      await deleteMistake(mistake._id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="border-b border-gray-800 p-6 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-bold bg-blue-900/40 text-blue-400 px-3 py-1 rounded">
                {mistake.subject}
              </span>
              <span className="text-sm font-bold bg-purple-900/40 text-purple-400 px-3 py-1 rounded">
                {mistake.topic}
              </span>
              <span className={`text-sm font-bold px-3 py-1 rounded ${mistake.status === 'Resolved' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-gray-800 text-gray-300'}`}>
                {mistake.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">
              Mistake Details
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-8">
          
          {/* Question Section */}
          {mistake.question ? (
            <div className="bg-[#0F1117] p-5 rounded-xl border border-gray-800">
              <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Original Question</h3>
              <div 
                className="text-gray-200 font-serif mb-4" 
                dangerouslySetInnerHTML={{ __html: mistake.question.questionHtml || mistake.question.content || 'Question content not available' }} 
              />
              {mistake.question.imageUrl && (
                <img src={mistake.question.imageUrl} alt="Question" className="max-w-full rounded mb-4" />
              )}
            </div>
          ) : (
            <div className="bg-[#0F1117] p-5 rounded-xl border border-gray-800 text-gray-400 italic">
              Manual Note (No linked question)
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mistake Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Mistake Analysis</h3>
              
              <div className="bg-[#0F1117] p-4 rounded-xl border border-gray-800 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Category</label>
                      <select 
                        value={form.detectedCategory}
                        onChange={e => setForm({...form, detectedCategory: e.target.value})}
                        className="w-full bg-[#1A1D24] border border-gray-700 rounded px-3 py-2 text-sm text-white"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Priority</label>
                      <select 
                        value={form.priority}
                        onChange={e => setForm({...form, priority: e.target.value})}
                        className="w-full bg-[#1A1D24] border border-gray-700 rounded px-3 py-2 text-sm text-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Category</span>
                      <span className="font-semibold text-blue-400">{mistake.detectedCategory}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Priority</span>
                      <span className={`font-semibold ${mistake.priority === 'High' ? 'text-red-400' : 'text-yellow-400'}`}>{mistake.priority}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="block text-xs text-gray-500 mb-1">Fix Action</span>
                  {isEditing ? (
                    <textarea 
                      value={form.fixAction}
                      onChange={e => setForm({...form, fixAction: e.target.value})}
                      className="w-full bg-[#1A1D24] border border-gray-700 rounded px-3 py-2 text-sm text-white"
                      rows="2"
                    />
                  ) : (
                    <p className="text-sm text-emerald-400 bg-emerald-900/10 p-3 rounded-lg border border-emerald-900/50">
                      {mistake.fixAction || 'No action defined.'}
                    </p>
                  )}
                </div>

                <div>
                  <span className="block text-xs text-gray-500 mb-1">Your Personal Note</span>
                  {isEditing ? (
                    <textarea 
                      value={form.userNote}
                      onChange={e => setForm({...form, userNote: e.target.value})}
                      className="w-full bg-[#1A1D24] border border-gray-700 rounded px-3 py-2 text-sm text-white"
                      rows="3"
                      placeholder="Add personal notes here..."
                    />
                  ) : (
                    <p className="text-sm text-gray-300 bg-[#1A1D24] p-3 rounded-lg">
                      {mistake.userNote || <span className="text-gray-600 italic">No notes added. Click Edit to add one.</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* History & Stats */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">History & Impact</h3>
              
              <div className="bg-[#0F1117] p-4 rounded-xl border border-gray-800">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Times Repeated</span>
                    <span className="font-bold text-xl">{mistake.timesRepeated}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Total Marks Lost</span>
                    <span className="font-bold text-xl text-red-400">{mistake.marksLost}</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-gray-500 mb-3 border-b border-gray-800 pb-2">Occurrence History</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {mistake.history.map((h, i) => (
                    <div key={i} className="bg-[#1A1D24] p-3 rounded text-sm flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-500 block">
                          {new Date(h.date).toLocaleDateString()} • {h.source.replace('_', ' ')}
                        </span>
                        <span className="text-gray-300 block truncate max-w-[150px]" title={String(h.userAnswer)}>
                          Answer: {h.userAnswer !== undefined ? String(h.userAnswer) : 'Skipped/None'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={h.wasCorrect ? 'text-emerald-400' : 'text-red-400'}>
                          {h.wasCorrect ? 'Correct' : 'Wrong'}
                        </span>
                        <span className="text-xs text-gray-500 block">
                          <Clock size={10} className="inline mr-1" />{h.timeSpent}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-800 p-4 shrink-0 bg-[#1A1D24] rounded-b-2xl flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <Save size={16} /> Save Changes
                </button>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-gray-800 border border-gray-700 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Edit3 size={16} /> Edit Details
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDelete}
              disabled={saving}
              className="text-red-400 hover:text-red-300 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition"
            >
              <Trash2 size={16} /> Delete
            </button>
            <button 
              onClick={handleStatusToggle}
              disabled={saving}
              className={`${mistake.status === 'Open' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-yellow-600 hover:bg-yellow-500'} px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition text-white`}
            >
              {mistake.status === 'Open' ? <CheckCircle size={16} /> : <RotateCcw size={16} />} 
              {mistake.status === 'Open' ? 'Mark as Resolved' : 'Reopen Mistake'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MistakeDetailModal;
