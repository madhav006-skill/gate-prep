import React, { useEffect, useState } from 'react';
import { 
  Brain, Zap, CheckCircle, AlertTriangle, Search, X, MessageSquare, 
  ChevronRight, RefreshCw, Activity, Target
} from 'lucide-react';
import useSochoStore from '../store/sochoStore';

const Socho = () => {
  const { 
    queue, summary, history, loading, generating, error, filters,
    fetchSummary, fetchQueue, generateQueue, fetchHistory, setFilters, 
    submitExplanation, addToRevision, markMastered 
  } = useSochoStore();

  const [activeTab, setActiveTab] = useState('queue');
  const [selectedReview, setSelectedReview] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);

  useEffect(() => {
    fetchSummary();
    fetchQueue();
    fetchHistory();
    // Also auto-generate on page load to be seamless
    generateQueue();
  }, [fetchSummary, fetchQueue, generateQueue, fetchHistory]);

  const handleExplainClick = (review) => {
    setSelectedReview(review);
    setExplanation('');
    setDiagnosis(null);
  };

  const handleSubmitExplanation = async () => {
    if (!explanation.trim()) return;
    const res = await submitExplanation(selectedReview._id, explanation);
    if (res.success) {
      setDiagnosis(res.data);
    }
  };

  const closeReviewModal = () => {
    setSelectedReview(null);
    setDiagnosis(null);
  };

  const handleAction = async (actionType) => {
    if (actionType === 'revision') {
      await addToRevision(diagnosis._id);
    } else if (actionType === 'mastered') {
      await markMastered(diagnosis._id);
    }
    closeReviewModal();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-teal-900/40 via-blue-900/20 to-[#1A1D24] p-8 rounded-2xl border border-teal-500/30">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Brain size={120} className="text-teal-500" />
        </div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="bg-teal-500/20 p-3 rounded-xl border border-teal-500/50">
            <Brain className="text-teal-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Socho <span className="text-teal-400 font-light ml-2">| True Mastery Engine</span></h1>
            <p className="text-gray-400 mt-1">Correct answers are not enough. Prove that you understood them.</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-teal-900/50 to-gray-900 border border-teal-500/30 p-4 rounded-xl flex flex-col justify-center items-center text-center">
            <span className="text-sm text-gray-400 mb-1">True Mastery Score</span>
            <span className="text-3xl font-bold text-teal-400">{summary.trueMasteryScore}</span>
          </div>
          <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl text-center">
            <span className="text-xs text-gray-500 mb-1 block">Questions Reviewed</span>
            <span className="text-2xl font-bold text-white">{summary.questionsReviewed}</span>
          </div>
          <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl text-center">
            <span className="text-xs text-gray-500 mb-1 block">Mastered Concepts</span>
            <span className="text-2xl font-bold text-emerald-400">{summary.masteredConcepts}</span>
          </div>
          <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl text-center">
            <span className="text-xs text-gray-500 mb-1 block">Doubtful Correct</span>
            <span className="text-2xl font-bold text-yellow-400">{summary.doubtfulCorrect}</span>
          </div>
          <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl text-center">
            <span className="text-xs text-gray-500 mb-1 block">Lucky Correct</span>
            <span className="text-2xl font-bold text-orange-400">{summary.luckyCorrect}</span>
          </div>
          <div className="bg-[#1A1D24] border border-gray-800 p-4 rounded-xl text-center">
            <span className="text-xs text-gray-500 mb-1 block">Concept Gaps</span>
            <span className="text-2xl font-bold text-red-400">{summary.conceptGaps}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-[#1A1D24] p-1 rounded-lg mb-6 max-w-sm border border-gray-800">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'queue' ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Socho Queue {summary?.pendingCount > 0 && <span className="ml-1 bg-teal-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{summary.pendingCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          History
        </button>
      </div>

      {error && <div className="mb-4 text-red-400 bg-red-900/20 p-3 rounded text-sm">{error}</div>}

      {/* Queue View */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {queue.length === 0 && !loading && (
            <div className="text-center py-12 bg-[#1A1D24] rounded-xl border border-gray-800">
              <CheckCircle className="mx-auto text-gray-600 mb-3" size={48} />
              <p className="text-gray-400">No Socho reviews pending.</p>
              <p className="text-sm text-gray-500 mt-1">Submit a test to generate suspicious questions for review.</p>
            </div>
          )}

          {queue.map(item => (
            <div key={item._id} className="bg-[#1A1D24] border border-gray-700 rounded-xl p-5 hover:border-teal-500/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                    item.priority === 'High' ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
                    item.priority === 'Medium' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30' :
                    'bg-blue-900/50 text-blue-400 border border-blue-500/30'
                  }`}>
                    {item.priority} Priority
                  </span>
                  <span className={`text-xs font-bold ${
                    item.originalResult === 'Correct' ? 'text-emerald-400' :
                    item.originalResult === 'Wrong' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    Result: {item.originalResult}
                  </span>
                  <span className="text-xs text-gray-500">Test: {item.test?.title || 'Unknown Test'}</span>
                </div>
                
                <h3 className="text-white font-medium mb-1">{item.subject} <span className="text-gray-500 mx-1">&bull;</span> {item.topic}</h3>
                
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle size={14} className="text-orange-400" />
                  <span className="text-orange-300">Suspicion: {item.suspicionReason}</span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={() => handleExplainClick(item)}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <MessageSquare size={16} /> Explain Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History View */}
      {activeTab === 'history' && (
        <div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {['All', 'Mastered', 'Correct but Doubtful', 'Lucky Correct', 'Partial Understanding', 'Concept Gap', 'Calculation Error', 'Needs Revision'].map(label => (
              <button
                key={label}
                onClick={() => setFilters({ label: label === 'All' ? '' : label })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                  (filters.label === label || (label === 'All' && !filters.label))
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                    : 'bg-[#1A1D24] border-gray-700 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No history found for the selected filter.
              </div>
            )}
            
            {history.map(item => (
              <div key={item._id} className="bg-[#1A1D24] border border-gray-800 rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{item.subject} &bull; {item.topic}</div>
                    <div className={`text-sm font-bold ${
                      item.masteryLabel === 'Mastered' ? 'text-emerald-400' :
                      item.masteryLabel === 'Concept Gap' ? 'text-red-400' :
                      item.masteryLabel === 'Calculation Error' ? 'text-orange-400' : 'text-yellow-400'
                    }`}>
                      {item.masteryLabel}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Quality</div>
                    <div className="text-lg font-bold text-white">{item.explanationQuality}/100</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 bg-gray-900/50 p-2 rounded">
                  " {item.explanationText} "
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#0F1117] border-b border-gray-800 p-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="text-teal-400" size={20} /> Socho Review
              </h2>
              <button onClick={closeReviewModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {!diagnosis ? (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-xs font-bold">
                        {selectedReview.questionType}
                      </span>
                      <span className={`text-sm font-bold ${selectedReview.originalResult === 'Correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                        Your Result: {selectedReview.originalResult}
                      </span>
                    </div>
                    
                    <div className="bg-[#1A1D24] p-4 rounded-xl border border-gray-700 mb-4">
                      <p className="text-gray-200 mb-4 font-mono text-sm">{selectedReview.question?.content}</p>
                      
                      {selectedReview.questionType !== 'NAT' && selectedReview.question?.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedReview.question.options.map((opt, i) => {
                            const isSelected = Array.isArray(selectedReview.userAnswer) 
                              ? selectedReview.userAnswer.includes(opt.id)
                              : selectedReview.userAnswer === opt.id;
                            
                            return (
                              <div key={opt.id} className={`p-2 rounded text-sm border ${isSelected ? 'border-blue-500 bg-blue-900/20 text-white' : 'border-gray-700 bg-gray-800/50 text-gray-400'}`}>
                                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                {opt.text}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {selectedReview.questionType === 'NAT' && (
                        <div className="bg-gray-800 p-3 rounded mt-2 border border-gray-700 inline-block">
                          <span className="text-gray-400 text-sm">Your Answer: </span>
                          <span className="text-white font-bold">{selectedReview.userAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-5">
                    <h3 className="text-teal-400 font-bold mb-3">Explain Your Reasoning</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      {selectedReview.questionType === 'NAT' 
                        ? 'Explain your solving steps and formula used.' 
                        : selectedReview.originalResult === 'Wrong'
                          ? 'Explain how you approached this question. What concept did you use?'
                          : 'Explain why your selected option is correct and why the other options are wrong.'}
                    </p>
                    
                    <textarea
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="Write your reasoning in 2-5 lines..."
                      className="w-full bg-[#1A1D24] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 min-h-[120px] mb-4"
                    />
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmitExplanation}
                        disabled={loading || explanation.trim().length < 5}
                        className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        Submit Explanation
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                      diagnosis.masteryLabel === 'Mastered' ? 'bg-emerald-900/50 text-emerald-400 border-4 border-emerald-500/30' :
                      diagnosis.masteryLabel === 'Calculation Error' ? 'bg-orange-900/50 text-orange-400 border-4 border-orange-500/30' :
                      diagnosis.masteryLabel === 'Concept Gap' ? 'bg-red-900/50 text-red-400 border-4 border-red-500/30' :
                      'bg-yellow-900/50 text-yellow-400 border-4 border-yellow-500/30'
                    }`}>
                      <Target size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{diagnosis.masteryLabel}</h2>
                    <p className="text-gray-400 max-w-md mx-auto">{diagnosis.feedback}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#1A1D24] border border-gray-700 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500 mb-1">Explanation Quality</div>
                      <div className="text-2xl font-bold text-white">{diagnosis.explanationQuality}/100</div>
                    </div>
                    <div className="bg-[#1A1D24] border border-gray-700 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500 mb-1">Concept Clarity</div>
                      <div className="text-2xl font-bold text-white">{diagnosis.conceptClarity}/100</div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6 text-center">
                    <span className="block text-xs text-blue-400 uppercase tracking-wider font-bold mb-1">Recommended Action</span>
                    <span className="text-blue-100">{diagnosis.recommendedAction}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {diagnosis.masteryLabel !== 'Mastered' ? (
                      <>
                        <button
                          onClick={() => handleAction('revision')}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                        >
                          Add to Revision
                        </button>
                        <button
                          onClick={closeReviewModal}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={closeReviewModal}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg font-medium transition-colors"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Socho;
