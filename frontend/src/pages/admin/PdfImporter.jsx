import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import api from '../../api/client';
import ImportPreview from './ImportPreview';

const PdfImporter = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, processing, completed, failed
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setJobId(res.data.jobId);
      setStatus('processing');
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please check backend connection.');
      setUploading(false);
      setStatus('idle');
    }
  };

  useEffect(() => {
    let interval;
    if (jobId && status === 'processing') {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/import/status/${jobId}`);
          const job = res.data.data;
          
          setProgress(job.progress);
          
          if (job.status === 'completed') {
            clearInterval(interval);
            setExtractedQuestions(job.result);
            setStatus('completed');
            setUploading(false);
          } else if (job.status === 'failed') {
            clearInterval(interval);
            setError(job.error || 'OCR Processing failed');
            setStatus('failed');
            setUploading(false);
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000); // poll every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, status]);

  const handleSaveQuestions = async (payload) => {
    try {
      await api.post('/import/save', payload);
      alert('Questions saved to database successfully!');
      // Reset state to allow next import
      setFile(null);
      setJobId(null);
      setProgress(0);
      setStatus('idle');
      setExtractedQuestions([]);
    } catch (err) {
      alert('Failed to save questions');
      console.error(err);
    }
  };

  if (status === 'completed' && extractedQuestions.length > 0) {
    return <ImportPreview questions={extractedQuestions} onSave={handleSaveQuestions} onCancel={() => setStatus('idle')} />;
  }

  return (
    <div className="bg-[#1A1D24] p-4 sm:p-8 rounded-2xl border border-gray-800 shadow-xl max-w-3xl mx-auto mt-4 sm:mt-8">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Import from PDF</h2>
      <p className="text-gray-400 mb-8">Upload official GATE PYQ PDFs to automatically extract questions, equations, and tables using AI OCR.</p>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="mr-2" size={20} /> {error}
        </div>
      )}

      <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 sm:p-12 text-center hover:border-blue-500 transition relative bg-[#0F1117]/50">
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        {!file ? (
          <div className="flex flex-col items-center pointer-events-none">
            <UploadCloud className="text-blue-500 mb-4" size={48} />
            <p className="text-lg font-medium text-white">Drag & drop your PDF here</p>
            <p className="text-sm text-gray-500 mt-2">or click to browse from computer</p>
          </div>
        ) : (
          <div className="flex flex-col items-center pointer-events-none">
            <FileText className="text-emerald-500 mb-4" size={48} />
            <p className="text-lg font-medium text-emerald-400">{file.name}</p>
            <p className="text-sm text-gray-500 mt-2">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        )}
      </div>

      {status === 'processing' && (
        <div className="mt-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-blue-400 flex items-center">
              <Loader2 className="animate-spin mr-2" size={16} /> Extracting content via AI OCR...
            </span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold transition flex items-center justify-center"
        >
          {status === 'uploading' ? 'Uploading...' : 'Start Extraction'}
        </button>
      </div>
    </div>
  );
};

export default PdfImporter;
