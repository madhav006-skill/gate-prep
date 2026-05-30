import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';
import { Clock, Calculator, AlertCircle, Info } from 'lucide-react';
import QuestionPanel from '../components/exam/QuestionPanel';
import QuestionPalette from '../components/exam/QuestionPalette';
import VirtualCalculator from '../components/exam/VirtualCalculator';

const ExamLayout = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { 
    startTest, 
    testMeta, 
    timeLeft, 
    tickTime, 
    isSubmitted,
    isLoading
  } = useExamStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    if (testId) {
      startTest(testId);
    }
  }, [testId, startTest]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSubmitted) {
        tickTime();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTime, isSubmitted]);

  // Fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Prevent back button & tab close
  useEffect(() => {
    if (isSubmitted || isLoading) return;

    // 1. Prevent Tab close / refresh
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "You have an ongoing test. Are you sure you want to leave?";
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Prevent Back Navigation
    window.history.pushState(null, document.title, window.location.href);
    const handlePopState = (e) => {
      window.history.pushState(null, document.title, window.location.href);
      
      const confirmFirst = window.confirm("WARNING: Navigating away will SUBMIT your ongoing test! Do you want to proceed?");
      if (confirmFirst) {
        const confirmSecond = window.confirm("FINAL WARNING: Click OK to SUBMIT the test and exit. Click Cancel to resume.");
        if (confirmSecond) {
          useExamStore.getState().submitTest();
        }
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSubmitted, isLoading]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F1117]">
        <div className="text-white text-xl animate-pulse">Loading Test Environment...</div>
      </div>
    );
  }

  // Redirect to result when submitted
  useEffect(() => {
    if (isSubmitted) {
      const attemptId = useExamStore.getState().attemptId;
      navigate(`/result/${attemptId}`);
    }
  }, [isSubmitted, navigate]);

  if (isSubmitted) {
    return null;
  }

  if (!testMeta) return <div className="text-white">Test not found</div>;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-[#0F1117] text-gray-200 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center bg-[#1E2128] p-4 border-b border-gray-700">
        <div>
          <h1 className="text-xl font-bold text-blue-400">{testMeta.title}</h1>
          <p className="text-sm text-gray-400">{testMeta.subject}</p>
        </div>
        
        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          
          <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <Clock size={18} className="text-blue-400" />
            <span className="text-xl font-mono text-white tracking-widest">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex-1 flex flex-col overflow-y-auto border-r border-gray-700">
          <div className="flex justify-between items-center bg-gray-800 p-2 border-b border-gray-700">
            <div className="flex items-center text-sm font-medium text-gray-300">
              <span className="bg-blue-600 text-white px-2 py-1 rounded mr-3">
                Q {useExamStore.getState().currentQuestionIndex + 1}
              </span>
              Marks: +{testMeta.questions[useExamStore.getState().currentQuestionIndex]?.question?.marks || 1}
            </div>
            <button 
              onClick={() => setShowCalculator(!showCalculator)}
              className={`flex items-center text-sm px-3 py-1 rounded transition ${showCalculator ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white bg-gray-700'}`}
            >
              <Calculator size={16} className="mr-2" /> Virtual Calculator
            </button>
          </div>
          
          {showCalculator && <VirtualCalculator onClose={() => setShowCalculator(false)} />}
          
          <div className="flex-1 p-6">
            <QuestionPanel />
          </div>
        </div>

        {/* Right: Question Palette & Profile */}
        <div className="w-80 flex flex-col bg-[#1A1D24]">
          {/* Candidate Profile summary */}
          <div className="flex items-center p-4 border-b border-gray-700">
            <div className="w-12 h-12 rounded-full bg-gray-600 mr-4"></div>
            <div>
              <p className="text-white font-medium">Candidate Name</p>
              <p className="text-xs text-gray-400">Registration: GATE2026</p>
            </div>
          </div>
          
          {/* Palette Legend */}
          <div className="p-4 border-b border-gray-700 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center"><div className="w-4 h-4 rounded exam-palette-green mr-2"></div> Answered</div>
            <div className="flex items-center"><div className="w-4 h-4 rounded exam-palette-red mr-2"></div> Not Answered</div>
            <div className="flex items-center"><div className="w-4 h-4 rounded exam-palette-gray mr-2"></div> Not Visited</div>
            <div className="flex items-center"><div className="w-4 h-4 rounded exam-palette-purple mr-2"></div> Marked for Review</div>
            <div className="flex items-center col-span-2"><div className="w-4 h-4 rounded exam-palette-purple-green mr-2"></div> Answered & Marked for Review</div>
          </div>
          
          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-300">Question Palette:</h3>
            <QuestionPalette />
          </div>

          {/* Submit Action */}
          <div className="p-4 border-t border-gray-700">
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to submit the test?")) {
                  useExamStore.getState().submitTest();
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamLayout;
