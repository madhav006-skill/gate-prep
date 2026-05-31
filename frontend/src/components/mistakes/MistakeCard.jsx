import React from 'react';
import { AlertCircle, FileText, CheckCircle, Flame, Clock } from 'lucide-react';

const MistakeCard = ({ mistake, onClick }) => {
  const isHighPriority = mistake.priority === 'High';
  const isResolved = mistake.status === 'Resolved';

  return (
    <div 
      onClick={onClick}
      className={`bg-[#1A1D24] border ${isResolved ? 'border-emerald-500/30' : isHighPriority ? 'border-red-500/50' : 'border-gray-800'} p-5 rounded-xl hover:bg-gray-800 cursor-pointer transition flex flex-col`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs font-bold bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
            {mistake.subject}
          </span>
          <span className="text-xs font-bold bg-purple-900/30 text-purple-400 px-2 py-1 rounded truncate max-w-[150px]">
            {mistake.topic}
          </span>
        </div>
        {isResolved ? (
          <CheckCircle className="text-emerald-500" size={18} />
        ) : isHighPriority ? (
          <Flame className="text-red-500" size={18} />
        ) : (
          <AlertCircle className="text-yellow-500" size={18} />
        )}
      </div>

      <div className="flex items-center gap-2 mb-2 text-xs font-medium">
        <span className={`px-2 py-0.5 rounded-full ${
          mistake.detectedCategory.includes('Concept') ? 'bg-orange-900/30 text-orange-400' :
          mistake.detectedCategory.includes('Silly') ? 'bg-yellow-900/30 text-yellow-400' :
          mistake.detectedCategory.includes('Calculation') ? 'bg-blue-900/30 text-blue-400' :
          'bg-gray-700 text-gray-300'
        }`}>
          {mistake.detectedCategory}
        </span>
        {mistake.timesRepeated > 1 && (
          <span className="text-pink-400 bg-pink-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock size={10} /> Repeated x{mistake.timesRepeated}
          </span>
        )}
      </div>

      <p className="text-gray-300 text-sm font-medium line-clamp-2 mb-4 flex-grow">
        {mistake.shortSummary || mistake.fixAction || 'No summary available.'}
      </p>

      <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500 mt-auto">
        <span>- {mistake.marksLost} Marks</span>
        <span className="flex items-center gap-1">
          <FileText size={12} /> {mistake.questionType}
        </span>
      </div>
    </div>
  );
};

export default MistakeCard;
