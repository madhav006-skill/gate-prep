import React, { useEffect, useState } from 'react';
import { Brain, Zap, RotateCcw, Target, TrendingUp, Settings, ChevronRight, CheckCircle2, Play, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAdaptiveStore from '../store/adaptiveStore';

const MODES = [
  {
    id: 'Weakness Booster',
    icon: <Target className="text-red-500" size={24} />,
    title: 'Weakness Booster',
    desc: 'Focus on topics where your accuracy is lowest and you lost the most marks.',
    duration: '~45 mins'
  },
  {
    id: 'Speed Drill',
    icon: <Zap className="text-yellow-500" size={24} />,
    title: 'Speed Drill',
    desc: 'Shorter test focused on improving your solving speed in easy and medium questions.',
    duration: '~20 mins'
  },
  {
    id: 'Mistake Recovery',
    icon: <RotateCcw className="text-orange-500" size={24} />,
    title: 'Mistake Recovery',
    desc: 'Retest yourself on previous wrong answers and unresolved notebook mistakes.',
    duration: '~30 mins'
  },
  {
    id: 'Full Adaptive Mock',
    icon: <Brain className="text-blue-500" size={24} />,
    title: 'Full Adaptive Mock',
    desc: 'A complete exam-style mock personalized to balance your strong and weak areas.',
    duration: '~90 mins'
  },
  {
    id: 'Rank Push Test',
    icon: <TrendingUp className="text-emerald-500" size={24} />,
    title: 'Rank Push Test',
    desc: 'Find easy marks and high-scoring topics where you can improve the fastest.',
    duration: '~60 mins'
  },
  {
    id: 'NAT Accuracy Drill',
    icon: <Settings className="text-purple-500" size={24} />,
    title: 'NAT Accuracy Drill',
    desc: 'Calculation-heavy numerical questions to improve precision and accuracy.',
    duration: '~40 mins'
  }
];

const AdaptiveMockTest = () => {
  const navigate = useNavigate();
  const { recommendation, history, loading, generating, error, previewTest, fetchRecommendation, fetchHistory, generateTest, clearPreview } = useAdaptiveStore();
  
  const [selectedMode, setSelectedMode] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    mode: 'Weakness Booster',
    questionCount: 15,
    difficultyBalance: 'Auto'
  });

  useEffect(() => {
    fetchRecommendation();
    fetchHistory();
    clearPreview();
  }, [fetchRecommendation, fetchHistory, clearPreview]);

  const handleGenerate = async (modeName) => {
    await generateTest({ mode: modeName, questionCount: 15, difficultyBalance: 'Auto' });
  };

  const handleCustomGenerate = async () => {
    await generateTest(customSettings);
    setShowCustomModal(false);
  };

  const handleStart = (testId) => {
    navigate(`/exam/${testId}`);
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-white p-4 sm:p-8 font-sans pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Brain className="text-blue-500" size={32} />
            Adaptive Mock Test
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Personalized tests generated dynamically from your weak topics, speed issues, and mistake history.</p>
        </div>

        {/* Loading & Errors */}
        {loading && <p className="text-gray-400">Analyzing your performance data...</p>}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle /> {error}
          </div>
        )}

        {/* Recommendation Banner */}
        {recommendation && !previewTest && (
          <div className="bg-gradient-to-r from-blue-900/50 to-[#1A1D24] border border-blue-500/50 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED FOR YOU</div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Target className="text-blue-400" /> {recommendation.mode}
                </h2>
                <p className="text-gray-300 mb-3">{recommendation.reason}</p>
                {recommendation.focusTopics && recommendation.focusTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center">Targeting:</span>
                    {recommendation.focusTopics.map(t => (
                      <span key={t} className="bg-blue-900/40 text-blue-300 text-xs px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleGenerate(recommendation.mode)}
                disabled={generating}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 whitespace-nowrap transition disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Recommended Test'} <Play size={18}/>
              </button>
            </div>
          </div>
        )}

        {/* Generated Preview Modal */}
        {previewTest && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1D24] border border-blue-500/50 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
              
              <h2 className="text-2xl font-bold text-white mb-1">Test Generated Successfully!</h2>
              <p className="text-blue-400 font-medium mb-6">{previewTest.title}</p>
              
              <div className="bg-[#0F1117] p-5 rounded-xl border border-gray-800 mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Why this test was generated</h3>
                <p className="text-gray-300">{previewTest.adaptiveReason}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0F1117] border border-gray-800 p-4 rounded-xl text-center">
                  <span className="block text-xs text-gray-500 mb-1">Questions</span>
                  <span className="text-xl font-bold">{previewTest.questions?.length || Object.values(previewTest.topicDistribution || {}).reduce((a,b)=>a+b,0)}</span>
                </div>
                <div className="bg-[#0F1117] border border-gray-800 p-4 rounded-xl text-center">
                  <span className="block text-xs text-gray-500 mb-1">Total Marks</span>
                  <span className="text-xl font-bold text-emerald-400">{previewTest.totalMarks}</span>
                </div>
                <div className="bg-[#0F1117] border border-gray-800 p-4 rounded-xl text-center">
                  <span className="block text-xs text-gray-500 mb-1">Duration</span>
                  <span className="text-xl font-bold text-yellow-400">{previewTest.duration}m</span>
                </div>
                <div className="bg-[#0F1117] border border-gray-800 p-4 rounded-xl text-center">
                  <span className="block text-xs text-gray-500 mb-1">Difficulty Focus</span>
                  <span className="text-sm font-bold capitalize text-red-400 mt-2 block">
                    {Object.keys(previewTest.difficultyDistribution || {}).sort((a,b)=>previewTest.difficultyDistribution[b]-previewTest.difficultyDistribution[a])[0] || 'Mixed'}
                  </span>
                </div>
              </div>

              <div className="bg-[#0F1117] p-5 rounded-xl border border-gray-800 mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Topic Distribution</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewTest.topicDistribution || {}).map(([topic, count]) => (
                    <span key={topic} className="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                      {topic} <span className="bg-gray-700 text-white px-1.5 rounded-full">{count}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={clearPreview}
                  className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleStart(previewTest._id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-900/20"
                >
                  Start Test Now <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode Selector */}
        {!previewTest && (
          <div>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold text-white">Select a Mode</h2>
              <button 
                onClick={() => setShowCustomModal(true)}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Settings size={16} /> Custom Generator
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {MODES.map(mode => (
                <div 
                  key={mode.id}
                  onClick={() => handleGenerate(mode.id)}
                  className={`bg-[#1A1D24] border border-gray-800 p-6 rounded-2xl cursor-pointer hover:border-gray-500 transition group ${generating ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="bg-[#0F1117] w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {mode.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{mode.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{mode.desc}</p>
                  
                  <div className="flex justify-between items-center text-xs font-medium border-t border-gray-800 pt-4">
                    <span className="text-gray-500 bg-[#0F1117] px-2 py-1 rounded">Est: {mode.duration}</span>
                    <span className="text-blue-500 group-hover:translate-x-1 transition-transform flex items-center">
                      Auto-Generate <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Generator Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Custom Adaptive Generator</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Target Mode</label>
                  <select 
                    value={customSettings.mode}
                    onChange={e => setCustomSettings({...customSettings, mode: e.target.value})}
                    className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    {MODES.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Number of Questions</label>
                  <select 
                    value={customSettings.questionCount}
                    onChange={e => setCustomSettings({...customSettings, questionCount: parseInt(e.target.value)})}
                    className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={25}>25 Questions</option>
                    <option value={40}>40 Questions</option>
                    <option value={65}>65 Questions (Full)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty Balance</label>
                  <select 
                    value={customSettings.difficultyBalance}
                    onChange={e => setCustomSettings({...customSettings, difficultyBalance: e.target.value})}
                    className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value="Auto">Auto (Based on my readiness)</option>
                    <option value="Easy Focus">Easy Focus</option>
                    <option value="Medium Focus">Medium Focus</option>
                    <option value="Hard Challenge">Hard Challenge</option>
                  </select>
                </div>
              </div>

              <div className="pt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setShowCustomModal(false)}
                  className="px-6 py-2.5 rounded-lg font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCustomGenerate}
                  disabled={generating}
                  className="px-6 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Custom Test'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdaptiveMockTest;
