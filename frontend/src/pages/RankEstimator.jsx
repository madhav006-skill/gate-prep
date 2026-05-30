import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, ChevronDown, Info,
  CheckCircle2, XCircle, BarChart2, BookOpen,
  ArrowRight, Loader2, Target, Database, Send, Award
} from 'lucide-react';
import useRankEstimatorStore from '../store/rankEstimatorStore';

const PAPERS = [
  { code: 'CS', name: 'CS - Computer Science & IT' },
  { code: 'DA', name: 'DA - Data Science & AI' },
  { code: 'ECE', name: 'ECE - Electronics & Communication' },
  { code: 'ME', name: 'ME - Mechanical Engineering' },
];

const YEARS = [
  { value: 'average', label: 'Average of verified years (recommended)' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
];

const CATEGORIES = ['General', 'OBC', 'EWS', 'SC', 'ST'];

const CONFIDENCE_CONFIG = {
  High:   { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', label: '● High Confidence' },
  Medium: { color: 'text-yellow-400',  bg: 'bg-yellow-500/20 border-yellow-500/40',  label: '● Medium Confidence' },
  Low:    { color: 'text-orange-400',  bg: 'bg-orange-500/20 border-orange-500/40',  label: '● Low Confidence'    },
};

function ConfidenceBadge({ level }) {
  const cfg = CONFIDENCE_CONFIG[level];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ────────────────────────────────────────────
// Submit Your Result Modal
// ────────────────────────────────────────────
function SubmitResultModal({ onClose }) {
  const { submitUserResult } = useRankEstimatorStore();
  const [form, setForm] = useState({ examYear: '2025', paperCode: 'CS', category: 'General', rawMarks: '', gateScore: '', allIndiaRank: '', consentAnonymous: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await submitUserResult(form);
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1D24] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {done ? (
          <div className="text-center py-8">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Result Submitted!</h3>
            <p className="text-gray-400 text-sm mb-6">Your result will be reviewed and verified by admin before being added to the dataset.</p>
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg">Done</button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Submit Your Real GATE Result</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {err && <div className="bg-red-900/30 border border-red-500/40 text-red-400 text-sm px-4 py-2 rounded-lg mb-4">{err}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Year *</label>
                  <select className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    value={form.examYear} onChange={e => setForm(f => ({ ...f, examYear: e.target.value }))}>
                    {['2025','2024','2023','2022'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Paper *</label>
                  <select className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    value={form.paperCode} onChange={e => setForm(f => ({ ...f, paperCode: e.target.value }))}>
                    {PAPERS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category *</label>
                <select className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['rawMarks','Raw Marks *','e.g. 62.33'],['gateScore','GATE Score','Optional'],['allIndiaRank','AIR *','e.g. 1450']].map(([key, label, ph]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <input type="number" step="0.01" placeholder={ph}
                      className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-0.5 accent-blue-500"
                  checked={form.consentAnonymous} onChange={e => setForm(f => ({ ...f, consentAnonymous: e.target.checked }))} />
                <span className="text-xs text-gray-400">I consent to my result being used anonymously to help other GATE aspirants estimate their rank.</span>
              </label>
              <button type="submit" disabled={loading || !form.rawMarks || !form.allIndiaRank || !form.consentAnonymous}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Submit Result
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────
const RankEstimator = () => {
  const navigate = useNavigate();
  const { estimate, result, loading, error, clearResult } = useRankEstimatorStore();

  const [paper, setPaper] = useState('CS');
  const [yearMode, setYearMode] = useState('average');
  const [category, setCategory] = useState('General');
  const [marks, setMarks] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);

  const ALL_YEAR_MAP = { CS: [2022,2023,2024,2025], DA: [2024,2025], ECE: [2022,2023,2024,2025], ME: [2022,2023,2024,2025] };
  const availableYears = ALL_YEAR_MAP[paper] || [];

  const handleEstimate = () => {
    if (!marks || parseFloat(marks) < 0 || parseFloat(marks) > 100) return;
    const examYears = yearMode === 'average' ? availableYears : [parseInt(yearMode)];
    estimate({ paperCode: paper, examYears, category, expectedRawMarks: parseFloat(marks) });
  };

  useEffect(() => { clearResult(); }, [paper, yearMode, category]);

  const r = result;

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F1117] via-[#1a1535] to-[#0F1117] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
          ← Dashboard
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-white flex items-center gap-2 justify-center">
            <TrendingUp size={20} className="text-purple-400" />
            Real GATE Rank Estimator
          </h1>
          <p className="text-xs text-gray-500">Historical-data-based estimation · Only verified records</p>
        </div>
        <button onClick={() => setShowSubmit(true)}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
          <Send size={12} /> Submit My Result
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Data Integrity Notice */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex gap-3">
          <Database size={18} className="text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-blue-300 text-sm font-semibold mb-1">Data-Driven · No Fake Predictions</p>
            <p className="text-gray-400 text-xs">This estimator uses only verified historical GATE marks-vs-rank records from public datasets (gatecse.in, careers360, Reddit, coaching analyses). If sufficient verified data is not available for your selection, we will clearly say so instead of showing a fake rank.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Input Panel ── */}
          <div className="lg:col-span-2 bg-[#1A1D24] border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target size={16} className="text-purple-400" /> Estimate Your Rank
            </h2>

            {/* Paper */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">GATE Paper / Branch</label>
              <div className="space-y-2">
                {PAPERS.map(p => (
                  <button key={p.code} onClick={() => setPaper(p.code)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition ${paper === p.code ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-[#0F1117] border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    {p.name}
                  </button>
                ))}
              </div>
              {paper === 'DA' && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1"><Info size={11} /> DA paper was introduced in 2024. Data available for 2024 & 2025 only.</p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Year Baseline</label>
              <select value={yearMode} onChange={e => setYearMode(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm">
                <option value="average">Average of all verified years (recommended)</option>
                {availableYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${category === c ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-[#0F1117] border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Note: Category-specific rank data is limited. If insufficient, we'll use overall data and tell you.</p>
            </div>

            {/* Marks */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Expected Raw Marks (out of 100)</label>
              <input type="number" step="0.01" min="0" max="100"
                value={marks} onChange={e => setMarks(e.target.value)}
                placeholder="e.g. 62.33"
                className="w-full bg-[#0F1117] border border-gray-700 rounded-lg px-3 py-3 text-white text-lg font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
            </div>

            <button onClick={handleEstimate} disabled={loading || !marks}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <BarChart2 size={18} />}
              {loading ? 'Estimating...' : 'Estimate My Rank'}
            </button>
          </div>

          {/* ── Result Panel ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 flex gap-3">
                <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold mb-1">Estimation Error</p>
                  <p className="text-gray-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* No result yet */}
            {!result && !error && !loading && (
              <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl p-10 text-center">
                <TrendingUp size={48} className="text-gray-700 mx-auto mb-4" />
                <h3 className="text-gray-500 font-semibold mb-2">Enter Your Details</h3>
                <p className="text-gray-600 text-sm">Select your paper, year, category, and expected marks, then click "Estimate My Rank".</p>
              </div>
            )}

            {/* Insufficient Data */}
            {r && !r.estimable && (
              <div className="bg-[#1A1D24] border border-amber-700/40 rounded-2xl p-6">
                <div className="flex gap-3 mb-4">
                  <AlertTriangle size={22} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 font-bold text-base mb-1">Insufficient Verified Data</p>
                    <p className="text-gray-300 text-sm">{r.message}</p>
                  </div>
                </div>
                {r.dataInfo && (
                  <div className="bg-[#0F1117] rounded-lg p-4 text-sm space-y-1">
                    <p className="text-gray-400"><span className="text-gray-500">Paper:</span> {r.dataInfo.paperCode}</p>
                    <p className="text-gray-400"><span className="text-gray-500">Available records:</span> {r.dataInfo.recordCount}</p>
                    <p className="text-gray-400"><span className="text-gray-500">Minimum required:</span> 20 records</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-3">Ask admin to import verified marks-vs-rank data, or submit your own result to help build the dataset.</p>
              </div>
            )}

            {/* Out of Range */}
            {r && r.estimable && r.outOfRange && (
              <div className="bg-[#1A1D24] border border-gray-700 rounded-2xl p-6 space-y-4">
                <div className="flex gap-3">
                  <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-300 font-bold mb-1">Marks Out of Dataset Range</p>
                    <p className="text-gray-300 text-sm">{r.message}</p>
                  </div>
                </div>
                {r.boundedEstimate && (
                  <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-700/40 rounded-xl p-5 text-center">
                    <p className="text-gray-400 text-xs mb-1">Bounded Estimate</p>
                    <p className="text-3xl font-black text-white">Better than AIR {r.boundedEstimate.toLocaleString()}</p>
                  </div>
                )}
                <DataInfoPanel info={r.dataInfo} />
              </div>
            )}

            {/* ✅ SUCCESS - Main Estimate Result */}
            {r && r.estimable && !r.outOfRange && r.result && (
              <>
                {/* AIR Range Card */}
                <div className="bg-gradient-to-br from-purple-900/30 via-[#1A1D24] to-indigo-900/30 border border-purple-700/40 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Estimated AIR Range</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-black text-white">{r.result.rankMin.toLocaleString()}</span>
                        <span className="text-2xl text-gray-500">—</span>
                        <span className="text-5xl font-black text-white">{r.result.rankMax.toLocaleString()}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-2">This is a range, not an exact rank. Real rank depends on exam difficulty and candidate distribution that year.</p>
                    </div>
                    <Award size={40} className="text-purple-500/50" />
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <ConfidenceBadge level={r.result.confidence} />
                    {r.result.estimatedScoreRange && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-blue-500/40 bg-blue-500/10 text-blue-300">
                        GATE Score: ~{r.result.estimatedScoreRange.min} – {r.result.estimatedScoreRange.max}
                      </span>
                    )}
                  </div>
                </div>

                {/* Data Info */}
                {r.dataInfo && <DataInfoPanel info={r.dataInfo} />}

                {/* Explanation */}
                {r.result.explanation && (
                  <div className="bg-[#1A1D24] border border-gray-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                      <BookOpen size={14} className="text-gray-500" /> How This Was Estimated
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{r.result.explanation}</p>

                    {/* Nearest Data Points */}
                    {r.result.nearestPoints && r.result.nearestPoints.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Nearest Verified Records Used</p>
                        <div className="space-y-2">
                          {r.result.nearestPoints.map((pt, i) => (
                            <div key={i} className="flex items-center justify-between bg-[#0F1117] rounded-lg px-4 py-2.5 text-sm">
                              <span className="text-gray-300 font-medium">{pt.rawMarks} marks</span>
                              <ArrowRight size={14} className="text-gray-600" />
                              <span className="text-purple-400 font-bold">AIR {pt.allIndiaRank.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.dataInfo?.categoryNote && (
                      <div className="mt-3 bg-amber-900/20 border border-amber-700/30 rounded-lg px-4 py-2.5">
                        <p className="text-amber-300 text-xs flex items-center gap-1.5"><Info size={12} /> {r.dataInfo.categoryNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl px-5 py-4 flex gap-3">
                  <AlertTriangle size={16} className="text-gray-500 shrink-0 mt-0.5" />
                  <p className="text-gray-500 text-xs">{r.disclaimer}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dataset Credits */}
        <div className="bg-[#1A1D24] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Database size={14} /> Dataset Sources</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
            {['gatecse.in (CS 2023 crowdsourced)', 'Reddit r/GATEtard (DA 2025)', 'careers360.com (toppers & cutoffs)', 'collegedekho.com (ME ranks)', 'YouTube coaching analyses', 'Official IIT/IISc cutoffs', 'pw.live analyses', 'geeksforgeeks.org (ME 2025)'].map(src => (
              <div key={src} className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                {src}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSubmit && <SubmitResultModal onClose={() => setShowSubmit(false)} />}
    </div>
  );
};

function DataInfoPanel({ info }) {
  if (!info) return null;
  return (
    <div className="bg-[#1A1D24] border border-gray-800 rounded-xl px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      {[
        ['Paper', info.paperCode || '—'],
        ['Records Used', info.recordCount?.toLocaleString() || '—'],
        ['Years Used', info.yearsUsed?.join(', ') || (info.years?.join(', ')) || '—'],
        ['Category', info.category || '—'],
      ].map(([label, val]) => (
        <div key={label}>
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="font-semibold text-gray-200">{val}</p>
        </div>
      ))}
    </div>
  );
}

export default RankEstimator;
