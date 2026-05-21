import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Clock, Award, ArrowLeft, Loader2, PlayCircle, AlertCircle } from 'lucide-react';
import api from '../api/client';

const TestList = () => {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, attemptsRes] = await Promise.all([
          api.get('/tests'),
          api.get('/tests/user/my-attempts')
        ]);
        setTests(testsRes.data.data);
        setAttempts(attemptsRes.data.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load mock tests. Please try again.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTestAttemptStatus = (testId) => {
    return attempts.find(a => a.test === testId);
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-400 hover:text-blue-400 transition mb-6"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Available Mock Tests</h1>
        <p className="text-gray-400 mb-8">Select a test below to start your GATE preparation journey.</p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-xl">
            {error}
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-[#1A1D24] border border-gray-800 rounded-xl p-12 text-center">
            <FileText className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-300 mb-2">No tests available yet</h3>
            <p className="text-gray-500">Admins need to import GATE PDFs to create mock tests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => (
              <div key={test._id} className="bg-[#1A1D24] border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition shadow-lg group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-900/40 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-800">
                    {test.type}
                  </span>
                  <span className="bg-emerald-900/40 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-800">
                    {test.subject}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{test.title}</h3>
                <p className="text-sm text-gray-400 mb-6 flex-grow">{test.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-300 mb-6 bg-[#0F1117] p-3 rounded-lg">
                  <div className="flex items-center">
                    <Clock size={16} className="text-gray-500 mr-2" />
                    <span>{test.duration} Mins</span>
                  </div>
                  <div className="flex items-center">
                    <Award size={16} className="text-yellow-500 mr-2" />
                    <span>{test.totalMarks} Marks</span>
                  </div>
                  <div className="flex items-center">
                    <FileText size={16} className="text-blue-500 mr-2" />
                    <span>{test.questions?.length || 0} Qs</span>
                  </div>
                </div>
                
                {(() => {
                  const attempt = getTestAttemptStatus(test._id);
                  if (attempt && attempt.status === 'Submitted') {
                    return (
                      <div className="flex space-x-3 mt-auto">
                        <button 
                          onClick={() => navigate(`/result/${attempt._id}`)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-2 rounded-lg flex items-center justify-center transition"
                        >
                           Result
                        </button>
                        <button 
                          onClick={() => setSelectedTest(test)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-2 rounded-lg flex items-center justify-center transition"
                        >
                           Retake
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button 
                      onClick={() => setSelectedTest(test)}
                      className="w-full mt-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition"
                    >
                      <PlayCircle size={18} className="mr-2" /> Start Test
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#1A1D24] border border-gray-700 rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Start?</h3>
            <p className="text-gray-400 mb-6">{selectedTest.title}</p>
            
            <div className="bg-blue-900/20 border border-blue-900 rounded-xl p-4 mb-6">
              <div className="flex items-center text-blue-400 mb-2 font-medium">
                <Clock size={18} className="mr-2" /> Duration: {selectedTest.duration} Minutes
              </div>
              <div className="flex items-center text-blue-400 mb-2 font-medium">
                <Award size={18} className="mr-2" /> Total Marks: {selectedTest.totalMarks}
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-xl p-4 mb-8 flex items-start">
              <AlertCircle size={20} className="text-yellow-500 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-500/90">Once started, the timer cannot be paused. Ensure you have a stable internet connection and enough time to complete the test.</p>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => setSelectedTest(null)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => navigate(`/exam/${selectedTest._id}`)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(37,99,235,0.6)]"
              >
                Confirm & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestList;
