import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Plus, List, Save, ArrowLeft } from 'lucide-react';
import api from '../api/client';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('add-question');
  const [questions, setQuestions] = useState([]);
  
  // Add Question Form State
  const [formData, setFormData] = useState({
    subject: 'CS',
    topic: 'General Aptitude',
    type: 'MCQ',
    content: '',
    marks: 1,
    correctAnswer: '',
    explanation: ''
  });

  const [options, setOptions] = useState([{ text: '' }, { text: '' }, { text: '' }, { text: '' }]);

  const handleOptionChange = (idx, value) => {
    const newOptions = [...options];
    newOptions[idx].text = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        options: formData.type === 'MCQ' || formData.type === 'MSQ' ? options : [],
      };
      
      // In MSQ we split correctAnswer by comma
      if (formData.type === 'MSQ') {
        payload.correctAnswer = formData.correctAnswer.split(',').map(s => s.trim());
      }
      
      await api.post('/questions', payload);
      alert('Question added successfully!');
      
      setFormData({ ...formData, content: '', correctAnswer: '', explanation: '' });
      setOptions([{ text: '' }, { text: '' }, { text: '' }, { text: '' }]);
    } catch (err) {
      alert('Failed to add question');
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions');
      setQuestions(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchQuestions();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 font-sans p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8 pb-4 border-b border-gray-800">
          <Link to="/dashboard" className="text-gray-400 hover:text-white mr-4"><ArrowLeft /></Link>
          <ShieldCheck className="text-blue-500 mr-3" size={32} />
          <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
        </div>

        <div className="flex space-x-4 mb-8">
          <button 
            onClick={() => setActiveTab('add-question')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center ${activeTab === 'add-question' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Plus size={18} className="mr-2"/> Add Question
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center ${activeTab === 'manage' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <List size={18} className="mr-2"/> Question Bank ({questions.length})
          </button>
        </div>

        {activeTab === 'add-question' && (
          <div className="bg-[#1A1D24] p-8 rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Add New PYQ</h2>
            <form onSubmit={handleAddQuestion} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CS">Computer Science</option>
                    <option value="ME">Mechanical</option>
                    <option value="ECE">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Topic</label>
                  <input 
                    type="text" 
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Operating Systems"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="MSQ">Multiple Select (MSQ)</option>
                    <option value="NAT">Numerical Answer (NAT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Question Content (MathJax supported)</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                  placeholder="Enter question text here..."
                />
              </div>

              {(formData.type === 'MCQ' || formData.type === 'MSQ') && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">Options</label>
                  <div className="space-y-3">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <span className="font-bold bg-gray-800 w-8 h-8 flex items-center justify-center rounded text-gray-400">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="flex-1 bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          placeholder={`Option ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-blue-400 mb-2">
                    Correct Answer
                    {formData.type === 'MSQ' && <span className="text-gray-500 text-xs ml-2">(comma separated)</span>}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                    className="w-full bg-[#0F1117] border border-blue-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder={
                      formData.type === 'MCQ' ? "e.g. Option text exactly as typed above" : 
                      formData.type === 'MSQ' ? "e.g. Option1, Option3" : 
                      "e.g. 42.5 or 42.1-42.9"
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-400 mb-2">Marks</label>
                  <select 
                    value={formData.marks}
                    onChange={(e) => setFormData({...formData, marks: parseInt(e.target.value)})}
                    className="w-full bg-[#0F1117] border border-blue-900/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1 Mark</option>
                    <option value={2}>2 Marks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Explanation (Optional)</label>
                <textarea 
                  rows={3}
                  value={formData.explanation}
                  onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                  className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Explain the solution..."
                />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-700">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition flex items-center shadow-lg shadow-emerald-600/20">
                  <Save size={18} className="mr-2"/> Save Question
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="bg-[#1A1D24] rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#1E2128] text-gray-300 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Subject/Topic</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Question Snippet</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{q.subject}</div>
                      <div className="text-xs text-gray-500">{q.topic}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${q.type==='NAT' ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
                        {q.type} ({q.marks}M)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="truncate w-96 font-mono text-gray-300">{q.content}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-500 hover:text-blue-400 mr-3">Edit</button>
                      <button className="text-red-500 hover:text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No questions found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
