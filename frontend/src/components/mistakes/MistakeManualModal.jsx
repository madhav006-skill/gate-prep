import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import useMistakeStore from '../../store/mistakeStore';

const CATEGORIES = [
  'Concept Gap', 'Silly Mistake', 'Calculation Error', 
  'Time Pressure', 'Question Misread', 'Formula Forgotten', 'Other'
];

const MistakeManualModal = ({ onClose }) => {
  const addManualMistake = useMistakeStore(state => state.addManualMistake);
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    category: 'Concept Gap',
    priority: 'Low',
    description: '',
    fixAction: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.topic || !form.description) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    const res = await addManualMistake(form);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save mistake');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#1A1D24] border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white">Add Manual Mistake</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 p-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subject *</label>
                <input 
                  type="text" 
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="e.g. DBMS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Topic *</label>
                <input 
                  type="text" 
                  value={form.topic}
                  onChange={e => setForm({...form, topic: e.target.value})}
                  className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="e.g. Normalization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                <select 
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                <select 
                  value={form.priority}
                  onChange={e => setForm({...form, priority: e.target.value})}
                  className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Mistake Description *</label>
              <textarea 
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows="3"
                className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                placeholder="What went wrong?"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Fix Action (Optional)</label>
              <textarea 
                value={form.fixAction}
                onChange={e => setForm({...form, fixAction: e.target.value})}
                rows="2"
                className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                placeholder="How will you avoid this? (AI will generate one if left blank)"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-medium text-gray-300 bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {loading ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MistakeManualModal;
