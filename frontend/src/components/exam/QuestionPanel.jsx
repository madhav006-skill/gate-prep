import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useExamStore } from '../../store/examStore';

const QuestionPanel = () => {
  const { 
    questions, 
    currentQuestionIndex, 
    answers, 
    setAnswer, 
    clearResponse, 
    markForReview,
    navigateQuestion,
    saveAnswerToBackend
  } = useExamStore();

  const question = questions[currentQuestionIndex];
  const answerData = answers[question?._id] || {};
  const currentAnswer = answerData.answer;

  const [localNatValue, setLocalNatValue] = useState(currentAnswer || '');

  // Sync local NAT value when question changes
  useEffect(() => {
    if (question?.type === 'NAT') {
      setLocalNatValue(currentAnswer || '');
    }
  }, [currentQuestionIndex, question, currentAnswer]);

  if (!question) return <div>Loading question...</div>;

  const handleOptionChange = (optionText) => {
    if (question.type === 'MCQ') {
      setAnswer(question._id, optionText);
    } else if (question.type === 'MSQ') {
      let newAns = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
      if (newAns.includes(optionText)) {
        newAns = newAns.filter(item => item !== optionText);
      } else {
        newAns.push(optionText);
      }
      setAnswer(question._id, newAns.length > 0 ? newAns : null);
    }
  };

  const handleNatBlur = () => {
    if (localNatValue !== '') {
      setAnswer(question._id, localNatValue);
    }
  };

  const handleSaveAndNext = () => {
    // Commit local NAT value to the store before saving to backend
    // (handles the case where user clicks Save & Next without blurring the input)
    if (question.type === 'NAT' && localNatValue !== '') {
      setAnswer(question._id, localNatValue);
    }
    
    saveAnswerToBackend(question._id);
    if (currentQuestionIndex < questions.length - 1) {
      navigateQuestion(currentQuestionIndex + 1);
    }
  };

  const handleMarkReviewAndNext = () => {
    markForReview(question._id);
    saveAnswerToBackend(question._id);
    if (currentQuestionIndex < questions.length - 1) {
      navigateQuestion(currentQuestionIndex + 1);
    }
  };

  const handleClear = () => {
    clearResponse(question._id);
    if (question.type === 'NAT') setLocalNatValue('');
  };

  return (
    <div className="flex flex-col h-full text-gray-200">
      {/* Question Content */}
      <div className="mb-6 text-lg">
        {question.questionHtml ? (
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.questionHtml, { USE_PROFILES: { html: true } }) }} className="mathjax-content" />
        ) : (
          <p className="whitespace-pre-wrap">{question.content}</p>
        )}
        
        {/* Support both legacy image and new Cloudinary imageUrl */}
        {(question.imageUrl || question.image) && (
          <img src={question.imageUrl || question.image} alt="Question figure" className="mt-4 max-w-full max-h-96 object-contain rounded border border-gray-700 bg-gray-900 p-2" />
        )}

        {question.pdfUrl && (
          <div className="mt-4 p-4 border border-blue-900/50 bg-blue-900/10 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-400 font-medium">Supplementary Document attached</span>
            <a href={question.pdfUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition">
              View PDF
            </a>
          </div>
        )}
      </div>

      {/* Options or Input */}
      <div className="mb-8 flex-1">
        {(question.type === 'MCQ' || question.type === 'MSQ') && (
          <div className="space-y-3">
            {question.options?.map((opt, idx) => {
              const char = String.fromCharCode(65 + idx); // A, B, C, D
              const isChecked = question.type === 'MCQ' 
                ? currentAnswer === opt.text
                : Array.isArray(currentAnswer) && currentAnswer.includes(opt.text);

              return (
                <label 
                  key={idx} 
                  className={`flex items-start p-3 rounded cursor-pointer border transition-colors ${
                    isChecked ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <input
                    type={question.type === 'MCQ' ? 'radio' : 'checkbox'}
                    name={`q-${question._id}`}
                    value={opt.text}
                    checked={isChecked}
                    onChange={() => handleOptionChange(opt.text)}
                    className="mt-1 mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold mr-2">{char}.</span>
                  <span className="flex-1">{opt.text}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'NAT' && (
          <div>
            <label className="block mb-2 text-sm text-gray-400">Enter your numerical answer:</label>
            <input
              type="number"
              step="any"
              value={localNatValue}
              onChange={(e) => setLocalNatValue(e.target.value)}
              onBlur={handleNatBlur}
              className="w-full max-w-xs bg-gray-800 border border-gray-600 text-white rounded p-2 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., 42.5"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-700 mt-auto">
        <div className="flex space-x-2">
          <button 
            onClick={handleMarkReviewAndNext}
            className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded transition font-medium text-sm"
          >
            Mark for Review & Next
          </button>
          <button 
            onClick={handleClear}
            className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded transition font-medium text-sm"
          >
            Clear Response
          </button>
        </div>

        <div className="flex space-x-2">
          <button 
            onClick={() => navigateQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition font-medium text-sm"
          >
            Previous
          </button>
          <button 
            onClick={handleSaveAndNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition font-medium text-sm"
          >
            Save & Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
