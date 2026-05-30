import React, { useState } from 'react';
import { Save, X, Edit3, Check, Eye } from 'lucide-react';
import RichQuestionEditor from '../../components/admin/RichQuestionEditor';
import api from '../../api/client';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/dist/contrib/auto-render';

const ImportPreview = ({ questions, onSave, onCancel }) => {
  const [editableQuestions, setEditableQuestions] = useState(
    questions.map(q => ({ ...q, approved: true })) // default auto-approve for preview
  );
  
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Test Details
  const [testYear, setTestYear] = useState('2026');
  const [testShift, setTestShift] = useState('Shift 1');
  const [testSubject, setTestSubject] = useState('CS');
  const [testType, setTestType] = useState('Year-wise PYQ');
  const [testDesc, setTestDesc] = useState('Official GATE Previous Year Question Paper.');

  // Auto-render math when component mounts or updates
  React.useEffect(() => {
    const renderMath = () => {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ]
      });
    };
    // small timeout to ensure DOM is painted
    setTimeout(renderMath, 100);
  }, [editableQuestions]);

  const handleToggleApprove = (index) => {
    const updated = [...editableQuestions];
    updated[index].approved = !updated[index].approved;
    setEditableQuestions(updated);
  };

  const handleSaveEdit = (index, updatedQuestion) => {
    const updated = [...editableQuestions];
    updated[index] = { ...updatedQuestion, approved: true };
    setEditableQuestions(updated);
    setEditingIndex(null);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [progressData, setProgressData] = useState(null);

  const handleSubmit = async () => {
    setIsSaving(true);
    setProgressData({ percentage: 0 });
    
    const importJobId = Date.now().toString() + Math.floor(Math.random() * 1000);
    
    // Start polling for progress
    const pollInterval = setInterval(async () => {
      try {
        const { data: res } = await api.get(`/import/save-progress/${importJobId}`);
        if (res.success && res.data) {
          setProgressData(res.data);
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 2000);

    const generatedTitle = `GATE ${testSubject} ${testYear} ${testShift}`;
    const approvedOnly = editableQuestions.filter(q => q.approved).map(q => {
      const { approved, id, ...rest } = q;
      return rest;
    });
    
    try {
      // Pass metadata along with questions
      await onSave({
        importJobId,
        questions: approvedOnly,
        title: generatedTitle,
        description: testDesc,
        subject: testSubject,
        type: testType
      });
    } finally {
      clearInterval(pollInterval);
      setIsSaving(false);
      setProgressData(null);
    }
  };

  if (editingIndex !== null) {
    return (
      <RichQuestionEditor 
        question={editableQuestions[editingIndex]} 
        onSave={(q) => handleSaveEdit(editingIndex, q)}
        onCancel={() => setEditingIndex(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-6 px-4 sm:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Preview Extracted Questions</h2>
          <p className="text-sm sm:text-base text-gray-400">Review OCR results before saving. {editableQuestions.filter(q => q.approved).length} selected.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={onCancel} disabled={isSaving} className="px-6 py-2 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition disabled:opacity-50">
            Discard
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="px-6 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition flex items-center disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {progressData && progressData.total > 0 
                  ? `Classifying... (${progressData.percentage}%)` 
                  : 'Saving & Classifying...'}
              </>
            ) : (
              <>
                <Save size={18} className="mr-2"/> Import Selected
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-[#1A1D24] p-6 rounded-2xl border border-gray-800 mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Test Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
            <select 
              value={testSubject} 
              onChange={e => setTestSubject(e.target.value)}
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="CS">CS (Computer Science)</option>
              <option value="DA">DA (Data Science & AI)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Year</label>
            <select 
              value={testYear} 
              onChange={e => setTestYear(e.target.value)}
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Shift</label>
            <select 
              value={testShift} 
              onChange={e => setTestShift(e.target.value)}
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Single Shift">Single Shift</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Test Type</label>
            <select 
              value={testType} 
              onChange={e => setTestType(e.target.value)}
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="Year-wise PYQ">Year-wise PYQ</option>
              <option value="Full Mock">Full Mock</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <input 
              type="text" 
              value={testDesc} 
              onChange={e => setTestDesc(e.target.value)}
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {editableQuestions.map((q, idx) => (
          <div key={idx} className={`bg-[#1A1D24] p-6 rounded-2xl border transition ${q.approved ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-gray-800 opacity-60'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-900/40 text-blue-400 px-3 py-1 rounded text-xs font-bold">{q.type || q.questionType}</span>
                <span className="bg-purple-900/40 text-purple-400 px-3 py-1 rounded text-xs font-bold">{q.subject} • {q.topic}</span>
                <span className="bg-yellow-900/40 text-yellow-400 px-3 py-1 rounded text-xs font-bold">{q.marks} Marks</span>
              </div>
              <div className="flex gap-3 self-end md:self-auto">
                <button onClick={() => setEditingIndex(idx)} className="text-gray-400 hover:text-blue-400 flex items-center text-sm transition">
                  <Edit3 size={16} className="mr-1"/> Edit
                </button>
                <button 
                  onClick={() => handleToggleApprove(idx)}
                  className={`flex items-center text-sm font-medium px-3 py-1 rounded transition ${q.approved ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'}`}
                >
                  {q.approved ? <><X size={16} className="mr-1"/> Exclude</> : <><Check size={16} className="mr-1"/> Include</>}
                </button>
              </div>
            </div>

            <div className="text-gray-200 mb-6 bg-[#0F1117] p-4 rounded-lg font-serif">
              {/* Render rich HTML content */}
              <div dangerouslySetInnerHTML={{ __html: q.questionHtml || q.content }} />
              
              {/* Render auto-extracted diagram if present */}
              {q.base64Image && (
                <div className="mt-4 border border-blue-500/30 bg-blue-900/10 p-2 rounded inline-block">
                  <div className="text-xs text-blue-400 mb-1 flex items-center"><Eye size={12} className="mr-1"/> Auto-Extracted Diagram</div>
                  <img src={q.base64Image} alt="Auto-extracted diagram" className="max-w-full max-h-64 object-contain rounded bg-white" />
                </div>
              )}
            </div>

            {(q.questionType === 'MCQ' || q.questionType === 'MSQ') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, i) => {
                  const isCorrect = Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt.text) : q.correctAnswer === opt.text;
                  return (
                    <div key={i} className={`p-3 rounded border flex items-center ${isCorrect ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-gray-700 bg-[#0F1117]'}`}>
                      <span className="font-bold mr-3 text-gray-500">{String.fromCharCode(65 + i)}</span>
                      <span className={isCorrect ? 'text-emerald-400' : 'text-gray-300'}>{opt.text}</span>
                      {isCorrect && <Check size={16} className="ml-auto text-emerald-500" />}
                    </div>
                  );
                })}
              </div>
            )}

            {q.questionType === 'NAT' && (
              <div className="p-4 bg-emerald-900/10 border border-emerald-900/50 rounded inline-block mt-2">
                <span className="text-emerald-500 font-bold mr-2">Correct Answer Range:</span>
                <span className="text-white font-mono">{q.correctAnswer}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImportPreview;
