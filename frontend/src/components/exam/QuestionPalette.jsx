import React from 'react';
import { useExamStore } from '../../store/examStore';

const QuestionPalette = () => {
  const { questions, answers, currentQuestionIndex, navigateQuestion } = useExamStore();

  const getStatusClass = (status) => {
    switch(status) {
      case 'Answered': return 'exam-palette-green text-white';
      case 'Not Answered': return 'exam-palette-red text-white';
      case 'Marked for Review': return 'exam-palette-purple text-white';
      case 'Answered and Marked for Review': return 'exam-palette-purple-green text-white';
      case 'Not Visited': 
      default: return 'exam-palette-gray text-white';
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {questions.map((q, idx) => {
        const status = answers[q._id]?.status || 'Not Visited';
        const isCurrent = currentQuestionIndex === idx;
        
        return (
          <button
            key={q._id}
            onClick={() => navigateQuestion(idx)}
            className={`
              w-12 h-10 rounded-md font-medium text-sm flex items-center justify-center transition-all
              ${getStatusClass(status)}
              ${isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1A1D24] shadow-lg' : 'hover:opacity-80'}
            `}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
};

export default QuestionPalette;
