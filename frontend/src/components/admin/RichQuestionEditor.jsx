import React, { useState } from 'react';
import { Save, X, Upload, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import api from '../../api/client';

const RichQuestionEditor = ({ question, onSave, onCancel }) => {
  const [edited, setEdited] = useState({ ...question });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEdited(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(edited);
  };

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        if (type === 'image') {
          setEdited(prev => ({ ...prev, imageUrl: res.data.data.url }));
        } else if (type === 'pdf') {
          setEdited(prev => ({ ...prev, pdfUrl: res.data.data.url }));
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 bg-[#1A1D24] p-8 rounded-2xl border border-gray-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Edit Question</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <select 
              name="questionType" 
              value={edited.questionType || edited.type} 
              onChange={handleChange}
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg p-2 text-white"
            >
              <option value="MCQ">MCQ</option>
              <option value="MSQ">MSQ</option>
              <option value="NAT">NAT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Subject</label>
            <input 
              type="text" 
              name="subject" 
              value={edited.subject} 
              onChange={handleChange}
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Marks</label>
            <select 
              name="marks" 
              value={edited.marks} 
              onChange={handleChange}
              className="w-full bg-[#0F1117] border border-gray-700 rounded-lg p-2 text-white"
            >
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Question HTML (Supports MathJax $$...$$)</label>
          <textarea 
            name="questionHtml" 
            value={edited.questionHtml || edited.content} 
            onChange={handleChange}
            className="w-full bg-[#0F1117] border border-gray-700 rounded-lg p-4 text-white font-mono text-sm h-48"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Correct Answer</label>
          <input 
            type="text" 
            name="correctAnswer" 
            value={Array.isArray(edited.correctAnswer) ? edited.correctAnswer.join(', ') : edited.correctAnswer} 
            onChange={(e) => {
              const val = e.target.value;
              setEdited(prev => ({ 
                ...prev, 
                correctAnswer: prev.questionType === 'MSQ' ? val.split(',').map(s=>s.trim()) : val 
              }));
            }}
            className="w-full bg-[#0F1117] border border-gray-700 rounded-lg p-2 text-white"
            placeholder={edited.questionType === 'MSQ' ? "A, B, C" : "Exact string or range for NAT"}
          />
        </div>

        {/* Media Upload Section */}
        <div className="border border-gray-800 rounded-lg p-4 bg-[#1A1D24]">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <Upload size={18} className="mr-2 text-blue-500" /> Attached Media (Optional)
          </h3>
          <div className="grid grid-cols-2 gap-6">
            
            {/* Image Upload */}
            <div className="p-4 bg-[#0F1117] border border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300 flex items-center">
                  <ImageIcon size={16} className="mr-2 text-emerald-500" /> Diagram/Image
                </span>
                <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-xs text-white transition">
                  {uploading ? <Loader2 className="animate-spin" size={14}/> : 'Upload JPG/PNG'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} disabled={uploading} />
                </label>
              </div>
              {edited.imageUrl ? (
                <div className="relative group">
                  <img src={edited.imageUrl} alt="Question Diagram" className="w-full h-32 object-contain bg-gray-900 rounded border border-gray-700" />
                  <button onClick={() => setEdited(prev => ({ ...prev, imageUrl: '' }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                    <X size={14}/>
                  </button>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-800 rounded text-gray-600 text-xs">No image attached</div>
              )}
            </div>

            {/* PDF Upload */}
            <div className="p-4 bg-[#0F1117] border border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300 flex items-center">
                  <FileText size={16} className="mr-2 text-purple-500" /> Reference PDF
                </span>
                <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-xs text-white transition">
                  {uploading ? <Loader2 className="animate-spin" size={14}/> : 'Upload PDF'}
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'pdf')} disabled={uploading} />
                </label>
              </div>
              {edited.pdfUrl ? (
                <div className="h-32 flex flex-col items-center justify-center bg-gray-900 border border-gray-700 rounded relative group">
                  <FileText size={32} className="text-red-400 mb-2" />
                  <a href={edited.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">View Document</a>
                  <button onClick={() => setEdited(prev => ({ ...prev, pdfUrl: '' }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                    <X size={14}/>
                  </button>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-800 rounded text-gray-600 text-xs">No PDF attached</div>
              )}
            </div>

          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-800">
          <button onClick={onCancel} className="px-6 py-2 rounded-lg font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-500 transition flex items-center">
            <Save size={18} className="mr-2"/> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichQuestionEditor;
