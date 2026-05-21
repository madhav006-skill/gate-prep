import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useExamStore } from '../store/examStore';
import { CheckCircle, XCircle, Clock, Award, Target, BookOpen } from 'lucide-react';
import api from '../api/client';

const ResultLayout = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/tests/attempts/${attemptId}/result`);
        setResult(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-white">Loading Results...</div>;
  if (!result) return <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-white">Result not found.</div>;

  const formatTime = (seconds) => {
    const s = Math.round(seconds || 0);
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m > 0 ? m + 'm ' : ''}${secs}s`;
  };

  const totalAttempted = result.answers.filter(a => a.status.includes('Answered')).length;
  const totalQuestions = result.test.questions.length;

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{result.test.title} - Result</h1>
            <p className="text-gray-400">Attempt ID: {attemptId}</p>
          </div>
          <Link to="/dashboard" className="text-blue-500 hover:text-blue-400 transition font-medium">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1D24] p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center shadow-lg">
            <Award className="text-yellow-500 mb-2" size={32} />
            <p className="text-sm text-gray-400 font-medium">Total Score</p>
            <p className="text-3xl font-bold text-white mt-1">{result.score} <span className="text-lg text-gray-500">/ {result.test.totalMarks}</span></p>
          </div>
          
          <div className="bg-[#1A1D24] p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center shadow-lg">
            <Target className="text-emerald-500 mb-2" size={32} />
            <p className="text-sm text-gray-400 font-medium">Accuracy</p>
            <p className="text-3xl font-bold text-white mt-1">{result.accuracy.toFixed(1)}%</p>
          </div>
          
          <div className="bg-[#1A1D24] p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center shadow-lg">
            <CheckCircle className="text-blue-500 mb-2" size={32} />
            <p className="text-sm text-gray-400 font-medium">Attempted</p>
            <p className="text-3xl font-bold text-white mt-1">{totalAttempted} <span className="text-lg text-gray-500">/ {totalQuestions}</span></p>
          </div>
          
          <div className="bg-[#1A1D24] p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center shadow-lg">
            <Clock className="text-purple-500 mb-2" size={32} />
            <p className="text-sm text-gray-400 font-medium">Time Taken</p>
            <p className="text-3xl font-bold text-white mt-1">{formatTime(result.timeTaken)}</p>
          </div>
        </div>

        {/* Detailed Analysis Section */}
        <div className="bg-[#1A1D24] rounded-xl border border-gray-700 p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <BookOpen className="mr-2 text-blue-500" size={24}/> Question Analysis
          </h2>
          
          <div className="space-y-4">
            {result.answers.map((ans, i) => {
              const q = ans.question;
              return (
                <div key={ans._id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4 font-bold text-white ${ans.status.includes('Answered') ? (ans.isCorrect ? 'bg-emerald-600' : 'bg-red-600') : 'bg-gray-600'}`}>
                        Q{i+1}
                      </div>
                      <div className="flex-1 mr-4">
                        <p className="font-mono text-gray-300 text-sm mb-2">{q.content}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 bg-[#0F1117] p-3 rounded text-sm">
                          <div>
                            <span className="text-gray-500 mr-2">Your Answer:</span> 
                            <span className={ans.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                              {Array.isArray(ans.answer) ? ans.answer.join(', ') : (ans.answer || 'Not Answered')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 mr-2">Correct Answer:</span>
                            <span className="text-emerald-400">
                              {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                            </span>
                          </div>
                        </div>
                        {q.explanation && (
                          <div className="mt-3 text-xs text-gray-400 bg-blue-900/10 border border-blue-900/30 p-2 rounded">
                            <span className="text-blue-400 font-semibold mr-1">Explanation:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-lg ${ans.marksAwarded > 0 ? 'text-emerald-500' : (ans.marksAwarded < 0 ? 'text-red-500' : 'text-gray-500')}`}>
                        {ans.marksAwarded > 0 ? '+' : ''}{ans.marksAwarded} 
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(ans.timeSpent)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultLayout;
