import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, XCircle, Clock, Lightbulb, ChevronRight } from 'lucide-react';
import useRevisionStore from '../../store/revisionStore';

const PracticeModal = ({ item, onClose, onResult }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [natAnswer, setNatAnswer] = useState('');
  const [msqAnswers, setMsqAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef(null);
  const { practiceAnswer } = useRevisionStore();

  const q = item?.question;
  const qType = q?.type || item?.questionType;

  useEffect(() => {
    timerRef.current = setInterval(() => setTimeSpent(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    let answer;
    if (qType === 'MCQ') answer = selectedAnswer;
    else if (qType === 'MSQ') answer = msqAnswers;
    else answer = natAnswer;

    try {
      const data = await practiceAnswer(item._id, { answer, timeSpent });
      setResult(data.data);
      setSubmitted(true);
      onResult && onResult(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMsqToggle = (optText) => {
    setMsqAnswers(prev =>
      prev.includes(optText) ? prev.filter(a => a !== optText) : [...prev, optText]
    );
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!q) return null;

  const isAnswerProvided = qType === 'MCQ' ? !!selectedAnswer
    : qType === 'MSQ' ? msqAnswers.length > 0
    : natAnswer !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#12151c] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              qType === 'MCQ' ? 'bg-blue-500/20 text-blue-400' :
              qType === 'MSQ' ? 'bg-purple-500/20 text-purple-400' :
              'bg-orange-500/20 text-orange-400'
            }`}>{qType}</span>
            <span className="text-xs text-gray-400">{item.subject} • {item.topic}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              <span>{formatTime(timeSpent)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Question */}
        <div className="p-5">
          {q.imageUrl && (
            <img src={q.imageUrl} alt="question diagram" className="mb-4 max-h-48 object-contain rounded-lg border border-gray-700" />
          )}
          <div
            className="text-gray-200 text-sm leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: q.questionHtml || q.content || 'Question content unavailable.' }}
          />

          {/* MCQ Options */}
          {qType === 'MCQ' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx);
                const optText = opt.text || opt;
                const isSelected = selectedAnswer === optText;
                const isCorrect = submitted && optText === q.correctAnswer;
                const isWrong = submitted && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && setSelectedAnswer(optText)}
                    disabled={submitted}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition flex items-center gap-3 ${
                      isCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' :
                      isWrong ? 'border-red-500 bg-red-500/10 text-red-300' :
                      isSelected ? 'border-blue-500 bg-blue-500/10 text-blue-200' :
                      'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isCorrect ? 'bg-emerald-500 text-white' :
                      isWrong ? 'bg-red-500 text-white' :
                      isSelected ? 'bg-blue-500 text-white' :
                      'bg-gray-700 text-gray-300'
                    }`}>{label}</span>
                    <span>{optText}</span>
                    {isCorrect && <CheckCircle size={16} className="ml-auto text-emerald-400" />}
                    {isWrong && <XCircle size={16} className="ml-auto text-red-400" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* MSQ Options */}
          {qType === 'MSQ' && q.options && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">Select all correct options</p>
              {q.options.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx);
                const optText = opt.text || opt;
                const isSelected = msqAnswers.includes(optText);
                const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
                const isCorrectOpt = submitted && correctArr.some(c => String(c).toLowerCase() === String(optText).toLowerCase());
                const isWrong = submitted && isSelected && !isCorrectOpt;

                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && handleMsqToggle(optText)}
                    disabled={submitted}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition flex items-center gap-3 ${
                      isCorrectOpt ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' :
                      isWrong ? 'border-red-500 bg-red-500/10 text-red-300' :
                      isSelected ? 'border-blue-500 bg-blue-500/10 text-blue-200' :
                      'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                    }`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </span>
                    <span className="text-xs font-bold text-gray-500 mr-1">{label}.</span>
                    <span>{optText}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* NAT Input */}
          {qType === 'NAT' && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Enter numerical answer</p>
              <input
                type="number"
                value={natAnswer}
                onChange={(e) => setNatAnswer(e.target.value)}
                disabled={submitted}
                placeholder="Type your answer..."
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              {submitted && (
                <p className="text-xs mt-2 text-gray-400">
                  Correct Answer: <span className="text-emerald-400 font-bold">{q.correctAnswer}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Result Feedback */}
        {submitted && result && (
          <div className={`mx-5 p-4 rounded-xl border mb-4 ${
            result.isCorrect ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.isCorrect
                ? <CheckCircle size={18} className="text-emerald-400" />
                : <XCircle size={18} className="text-red-400" />}
              <span className={`font-bold text-sm ${result.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                {result.resultType}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Next revision: <span className="text-white font-medium">
                {result.newStatus === 'Completed' ? 'In 7+ days ✅' :
                 `${result.newPriority} priority, due ${new Date(result.nextDueDate).toLocaleDateString()}`}
              </span>
            </p>

            {/* Explanation */}
            {(q.explanation || q.explanationHtml) && (
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1 mt-3 text-xs text-yellow-400 hover:text-yellow-300 transition"
              >
                <Lightbulb size={13} />
                {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
              </button>
            )}
            {showExplanation && (
              <div
                className="mt-3 text-xs text-gray-300 leading-relaxed border-t border-gray-700 pt-3"
                dangerouslySetInnerHTML={{ __html: q.explanationHtml || q.explanation }}
              />
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-5 pt-0 flex gap-3">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!isAnswerProvided}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              Continue Revision <ChevronRight size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeModal;
