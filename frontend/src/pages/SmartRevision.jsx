import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Calendar, AlertTriangle, Clock, Zap, RefreshCw,
  CheckCheck, BellOff, PlayCircle, ChevronDown, ChevronUp,
  Target, TrendingUp, BookOpen, RotateCcw, Loader2
} from 'lucide-react';
import useRevisionStore from '../store/revisionStore';
import PracticeModal from '../components/revision/PracticeModal';

// ─── Reason badge config ──────────────────────────────────────────────────────
const REASON_CONFIG = {
  'Wrong Answer':            { color: 'bg-red-500/15 text-red-400 border-red-500/30',       icon: '✗', label: 'Wrong Answer' },
  'Slow but Correct':        { color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: '⏱', label: 'Slow but Correct' },
  'Marked for Review':       { color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',     icon: '🔖', label: 'Marked for Review' },
  'Skipped Easy':            { color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: '↩', label: 'Skipped Easy' },
  'Repeated Topic Weakness': { color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: '⚡', label: 'Repeated Weakness' },
};

const PRIORITY_CONFIG = {
  High:   { color: 'text-red-400 bg-red-500/10 border-red-500/30',       dot: 'bg-red-400' },
  Medium: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  Low:    { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
};

const STATUS_CONFIG = {
  Due:      { color: 'text-red-400', label: 'Due Today' },
  Overdue:  { color: 'text-red-500', label: 'Overdue' },
  Upcoming: { color: 'text-blue-400', label: 'Upcoming' },
  Completed:{ color: 'text-emerald-400', label: 'Completed' },
};

const QTYPE_CONFIG = {
  MCQ: 'bg-blue-500/20 text-blue-400',
  MSQ: 'bg-purple-500/20 text-purple-400',
  NAT: 'bg-orange-500/20 text-orange-400',
};

const FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'due-today',    label: 'Due Today' },
  { key: 'high-priority',label: 'High Priority' },
  { key: 'wrong',        label: 'Wrong' },
  { key: 'slow',         label: 'Slow' },
  { key: 'marked',       label: 'Marked' },
  { key: 'completed',    label: 'Completed' },
];

// ─── Relative date helper ─────────────────────────────────────────────────────
function relativeDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 0) return `In ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, label, value, color, subLabel }) => (
  <div className={`flex-1 min-w-[140px] bg-[#1a1d26] border border-gray-800 rounded-xl p-4 flex items-center gap-3`}>
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon size={16} />
    </div>
    <div>
      <div className="text-2xl font-bold text-white leading-none">{value ?? '—'}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      {subLabel && <div className="text-xs text-gray-600">{subLabel}</div>}
    </div>
  </div>
);

// ─── Revision Card ────────────────────────────────────────────────────────────
const RevisionCard = ({ item, onPractice, onSnooze, onComplete }) => {
  const [expanded, setExpanded] = useState(false);
  const reason = REASON_CONFIG[item.reason] || REASON_CONFIG['Wrong Answer'];
  const priority = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG['Medium'];
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG['Due'];
  const qtype = QTYPE_CONFIG[item.questionType] || QTYPE_CONFIG['MCQ'];

  const questionPreview = item.question?.questionHtml
    ? item.question.questionHtml.replace(/<[^>]*>/g, '').substring(0, 130) + '...'
    : 'Question content unavailable.';

  return (
    <div className={`bg-[#1a1d26] border rounded-xl overflow-hidden transition hover:border-gray-600 ${
      item.status === 'Overdue' ? 'border-red-500/40' :
      item.priority === 'High' && item.status !== 'Completed' ? 'border-orange-500/30' :
      'border-gray-800'
    }`}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject */}
            <span className="text-xs font-semibold text-gray-200 bg-gray-700/60 px-2 py-0.5 rounded">
              {item.subject}
            </span>
            {/* Topic */}
            <span className="text-xs text-gray-400">{item.topic}</span>
            {/* Type */}
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${qtype}`}>{item.questionType}</span>
          </div>

          {/* Status */}
          <span className={`text-xs font-medium flex-shrink-0 ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Reason + Priority row */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${reason.color}`}>
            {reason.icon} {reason.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${priority.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
            {item.priority} Priority
          </span>
        </div>

        {/* Question Preview */}
        <p className="text-sm text-gray-300 leading-relaxed mb-3 line-clamp-2">{questionPreview}</p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
          <span>Attempts: <span className="text-gray-300">{item.attempts}</span></span>
          <span>Last Practiced: <span className="text-gray-300">{relativeDate(item.lastPracticed)}</span></span>
          <span>Due: <span className={`font-medium ${status.color}`}>{relativeDate(item.dueDate)}</span></span>
        </div>

        {/* Recommended Action */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-400 flex items-start gap-2">
          <Target size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <span>{item.recommendedAction}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        {item.status !== 'Completed' && (
          <button
            onClick={() => onPractice(item)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
          >
            <PlayCircle size={13} />
            Practice Now
          </button>
        )}
        {item.status !== 'Completed' && (
          <button
            onClick={() => onComplete(item._id)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition"
          >
            <CheckCheck size={13} />
            Mark Revised
          </button>
        )}
        {item.status !== 'Completed' && (
          <button
            onClick={() => onSnooze(item._id)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-400 text-xs font-medium rounded-lg transition"
          >
            <BellOff size={13} />
            Snooze
          </button>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 ml-auto text-gray-500 hover:text-gray-300 text-xs transition"
        >
          {expanded ? 'Hide' : 'Details'}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded History */}
      {expanded && item.history && item.history.length > 0 && (
        <div className="px-4 pb-4 border-t border-gray-700 pt-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">Practice History</p>
          <div className="space-y-1">
            {item.history.slice(-5).reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(h.date).toLocaleDateString()}</span>
                <span className={h.wasCorrect ? 'text-emerald-400' : 'text-red-400'}>
                  {h.resultType}
                </span>
                <span>{h.timeSpent}s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main SmartRevision Page ──────────────────────────────────────────────────
export default function SmartRevision() {
  const navigate = useNavigate();
  const {
    revisionItems, summary, loading, error, filter,
    fetchRevisionQueue, fetchSummary, snoozeItem, markComplete, generateFromAttempts, setFilter
  } = useRevisionStore();

  const [activePracticeItem, setActivePracticeItem] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState('');

  useEffect(() => {
    fetchSummary();
    fetchRevisionQueue(filter);
  }, []);

  const handleFilterChange = (f) => {
    setFilter(f);
    fetchRevisionQueue(f);
  };

  const handlePracticeResult = () => {
    fetchSummary();
    fetchRevisionQueue(filter);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateMsg('');
    try {
      const data = await generateFromAttempts();
      setGenerateMsg(data.message || 'Revision queue updated!');
      fetchSummary();
      fetchRevisionQueue(filter);
    } catch (e) {
      setGenerateMsg('Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1017] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <Brain size={22} className="text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Smart Revision Engine</h1>
            </div>
            <p className="text-sm text-gray-400">
              Automatically schedules your weak, slow, and important questions for revision.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            title="Regenerate revision queue from all past attempts"
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            {generating
              ? <Loader2 size={15} className="animate-spin" />
              : <RefreshCw size={15} />}
            {generating ? 'Generating...' : 'Refresh Queue'}
          </button>
        </div>

        {generateMsg && (
          <div className="mb-6 px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-sm text-indigo-300">
            {generateMsg}
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="flex flex-wrap gap-3 mb-8">
          <SummaryCard icon={Calendar} label="Due Today" value={summary?.dueToday} color="bg-red-500/20 text-red-400" />
          <SummaryCard icon={Zap} label="High Priority" value={summary?.highPriority} color="bg-orange-500/20 text-orange-400" />
          <SummaryCard icon={AlertTriangle} label="Wrong Qs" value={summary?.wrongCount} color="bg-red-600/20 text-red-400" />
          <SummaryCard icon={Clock} label="Slow Qs" value={summary?.slowCount} color="bg-yellow-500/20 text-yellow-400" />
          <SummaryCard icon={Clock} label="Est. Time" value={summary ? `${summary.estimatedTimeMinutes}m` : null} color="bg-blue-500/20 text-blue-400" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${
                filter === f.key
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {f.label}
              {f.key === 'due-today' && summary?.dueToday > 0 && (
                <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                  {summary.dueToday}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
            <p className="text-sm">Building your revision queue…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <AlertTriangle size={32} className="mb-4 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => fetchRevisionQueue(filter)}
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition"
            >
              Try Again
            </button>
          </div>
        ) : revisionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-5">
              <BookOpen size={32} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Your revision queue is empty</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">
              Complete a mock test to automatically generate your personalized revision queue.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/tests')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition text-sm"
              >
                Take a Mock Test
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl transition text-sm"
              >
                <RotateCcw size={14} />
                {generating ? 'Generating...' : 'Generate from History'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{revisionItems.length} item{revisionItems.length !== 1 ? 's' : ''} in queue</p>
              {filter !== 'completed' && summary && (
                <p className="text-xs text-gray-600">
                  {summary.completed} completed · {summary.total} total
                </p>
              )}
            </div>
            {revisionItems.map(item => (
              <RevisionCard
                key={item._id}
                item={item}
                onPractice={(i) => setActivePracticeItem(i)}
                onSnooze={(id) => snoozeItem(id)}
                onComplete={(id) => markComplete(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Practice Modal */}
      {activePracticeItem && (
        <PracticeModal
          item={activePracticeItem}
          onClose={() => {
            setActivePracticeItem(null);
            handlePracticeResult();
          }}
          onResult={() => {}}
        />
      )}
    </div>
  );
}
